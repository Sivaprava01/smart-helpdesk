from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.session import get_db
from smart_helpdesk.main import app


@pytest.fixture
def client_with_db() -> tuple[TestClient, Session]:
    """Provides a TestClient with overridden isolated in-memory DB session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False,
    )
    session = TestingSessionLocal()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client, session
    app.dependency_overrides.clear()
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_api_initial_assignment_and_accept(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    # Setup category, customer, technician, ticket
    cat = client.post("/api/v1/categories", json={"name": "Plumbing"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Siva", "email": "siva@example.com", "phone_number": "+919876543210"},
    ).json()
    tech = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Ravi",
            "email": "ravi@example.com",
            "phone_number": "+919999999901",
            "is_on_duty": True,
            "category_ids": [cat["id"]],
        },
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Siva",
            "contact_phone": "+919876543210",
            "description": "Pipe leakage",
            "location": "Tower A",
        },
    ).json()

    # 1. Start assignment
    assign_res = client.post(f"/api/v1/tickets/{ticket['id']}/assign")
    assert assign_res.status_code == 200
    assign_data = assign_res.json()
    assert assign_data["assignment"]["status"] == "OFFERED"
    assert assign_data["assignment"]["technician_id"] == tech["id"]
    assignment_id = assign_data["assignment"]["id"]

    # 2. Accept assignment
    accept_res = client.post(f"/api/v1/assignments/{assignment_id}/accept")
    assert accept_res.status_code == 200
    accept_data = accept_res.json()
    assert accept_data["assignment"]["status"] == "ACCEPTED"

    # 3. Check ticket state and history
    ticket_res = client.get(f"/api/v1/tickets/{ticket['id']}")
    assert ticket_res.json()["status"] == "ASSIGNED"

    hist_res = client.get(f"/api/v1/tickets/{ticket['id']}/assignments")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) == 1


def test_api_decline_and_fallback_rerouting(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "Electrical"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Alice", "email": "alice@example.com", "phone_number": "+919876543211"},
    ).json()
    tech1 = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Electrician 1",
            "email": "e1@example.com",
            "phone_number": "+919999999902",
            "is_on_duty": True,
            "current_zone": "Tower A",
            "category_ids": [cat["id"]],
        },
    ).json()
    tech2 = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Electrician 2",
            "email": "e2@example.com",
            "phone_number": "+919999999903",
            "is_on_duty": True,
            "current_zone": "Tower D",
            "category_ids": [cat["id"]],
        },
    ).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Alice",
            "contact_phone": "+919876543211",
            "description": "Sparking wire",
            "location": "Tower A",
        },
    ).json()

    # Start assignment -> offered to Tech 1
    assign_res = client.post(f"/api/v1/tickets/{ticket['id']}/assign")
    assignment_id = assign_res.json()["assignment"]["id"]

    # Tech 1 declines
    decline_res = client.post(
        f"/api/v1/assignments/{assignment_id}/decline",
        json={"reason": "BUSY", "note": "Engaged with another customer"},
    )
    assert decline_res.status_code == 200
    decline_data = decline_res.json()
    assert decline_data["assignment"]["status"] == "DECLINED"
    assert decline_data["assignment"]["decline_reason"] == "BUSY"
    assert decline_data["fallback"]["status"] == "NEW_TECHNICIAN_OFFERED"
    assert decline_data["fallback"]["technician_id"] == tech2["id"]

    # Check assignment history contains 2 entries
    hist_res = client.get(f"/api/v1/tickets/{ticket['id']}/assignments")
    assert len(hist_res.json()) == 2


def test_api_ask_later_and_accept(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "Carpentry"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Bob", "email": "bob@example.com", "phone_number": "+919876543212"},
    ).json()
    tech = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Carpenter",
            "email": "carp@example.com",
            "phone_number": "+919999999904",
            "is_on_duty": True,
            "category_ids": [cat["id"]],
        },
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Bob",
            "contact_phone": "+919876543212",
            "description": "Table fix",
            "location": "Tower B",
        },
    ).json()

    assign_res = client.post(f"/api/v1/tickets/{ticket['id']}/assign")
    assignment_id = assign_res.json()["assignment"]["id"]

    # 1. Ask later
    ask_res = client.post(f"/api/v1/assignments/{assignment_id}/ask-later")
    assert ask_res.status_code == 200
    assert ask_res.json()["assignment"]["status"] == "DEFERRED"

    # 2. Accept while in DEFERRED status
    accept_res = client.post(f"/api/v1/assignments/{assignment_id}/accept")
    assert accept_res.status_code == 200
    assert accept_res.json()["assignment"]["status"] == "ACCEPTED"


def test_api_process_expired_assignments(client_with_db: tuple[TestClient, Session]) -> None:
    client, session = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "Cleaning"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Carol", "email": "carol@example.com", "phone_number": "+919876543213"},
    ).json()
    tech1 = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Cleaner 1", "email": "cl1@example.com", "phone_number": "+919999999905",
            "is_on_duty": True, "category_ids": [cat["id"]]
        },
    ).json()
    tech2 = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Cleaner 2", "email": "cl2@example.com", "phone_number": "+919999999906",
            "is_on_duty": True, "category_ids": [cat["id"]]
        },
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Carol",
            "contact_phone": "+919876543213",
            "description": "Deep cleaning",
            "location": "Tower C",
        },
    ).json()

    # Inject an expired assignment offer in database
    past_time = datetime.now(timezone.utc) - timedelta(minutes=15)
    expired = TechnicianAssignment(
        ticket_id=uuid.UUID(ticket["id"]),
        technician_id=uuid.UUID(tech1["id"]),
        status=AssignmentStatus.OFFERED,
        expires_at=past_time,
    )
    session.add(expired)
    session.commit()

    # Call process-expired endpoint
    proc_res = client.post("/api/v1/assignments/process-expired")
    assert proc_res.status_code == 200
    data = proc_res.json()
    assert data["expired_count"] == 1
    assert data["rerouted_count"] == 1
