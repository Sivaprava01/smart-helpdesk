from datetime import datetime, timezone
from decimal import Decimal
import uuid
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
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


def test_api_demo_a_successful_service_workflow(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    # 1. Create Category, Customer, Technician, Ticket
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
            "current_zone": "Tower A",
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
            "description": "Washroom pipe leakage",
            "location": "Tower A",
        },
    ).json()

    # 2. Offer -> Accept
    assign_res = client.post(f"/api/v1/tickets/{ticket['id']}/assign")
    assignment_id = assign_res.json()["assignment"]["id"]
    client.post(f"/api/v1/assignments/{assignment_id}/accept")

    # 3. Arrive
    arrive_res = client.post(f"/api/v1/tickets/{ticket['id']}/arrive")
    assert arrive_res.status_code == 200
    assert arrive_res.json()["status"] == "ARRIVED"

    # 4. Start Work
    start_res = client.post(f"/api/v1/tickets/{ticket['id']}/start-work")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # 5. Complete Work
    complete_res = client.post(
        f"/api/v1/tickets/{ticket['id']}/complete-work",
        json={"note": "Fixed pipe gasket"},
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "AWAITING_CUSTOMER_CONFIRMATION"

    # 6. Customer Confirms Resolved (5-star rating)
    response_res = client.post(
        f"/api/v1/tickets/{ticket['id']}/customer-response",
        json={
            "was_issue_resolved": True,
            "rating": 5,
            "comment": "Quick and helpful service",
        },
    )
    assert response_res.status_code == 200
    res_data = response_res.json()
    assert res_data["ticket_status"] == "CLOSED"
    assert res_data["feedback"]["was_issue_resolved"] is True
    assert res_data["feedback"]["rating"] == 5

    # 7. Check Feedback History
    fb_hist = client.get(f"/api/v1/tickets/{ticket['id']}/feedback-history")
    assert fb_hist.status_code == 200
    assert len(fb_hist.json()) == 1


def test_api_demo_b_reopen_and_alternative_rerouting(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "Electrical"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Alice", "email": "alice@example.com", "phone_number": "+919876543211"},
    ).json()
    tech1 = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Ravi (Electrician)",
            "email": "ravi_elec@example.com",
            "phone_number": "+919999999902",
            "is_on_duty": True,
            "current_zone": "Tower A",
            "category_ids": [cat["id"]],
        },
    ).json()
    tech2 = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Kumar (Electrician)",
            "email": "kumar_elec@example.com",
            "phone_number": "+919999999903",
            "is_on_duty": True,
            "current_zone": "Tower A",
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
            "description": "Short circuit in bedroom",
            "location": "Tower A",
        },
    ).json()

    # Assign -> Accept -> Arrive -> Start -> Complete
    assign_res = client.post(f"/api/v1/tickets/{ticket['id']}/assign")
    assignment_id = assign_res.json()["assignment"]["id"]
    assigned_tech_id = assign_res.json()["assignment"]["technician_id"]

    client.post(f"/api/v1/assignments/{assignment_id}/accept")
    client.post(f"/api/v1/tickets/{ticket['id']}/arrive")
    client.post(f"/api/v1/tickets/{ticket['id']}/start-work")
    client.post(f"/api/v1/tickets/{ticket['id']}/complete-work")

    # Customer responds: NOT RESOLVED
    reopen_res = client.post(
        f"/api/v1/tickets/{ticket['id']}/customer-response",
        json={
            "was_issue_resolved": False,
            "rating": 1,
            "comment": "Electricity still not working",
        },
    )
    assert reopen_res.status_code == 200
    reopen_data = reopen_res.json()
    assert reopen_data["ticket_status"] == "ROUTING"
    assert reopen_data["fallback"]["status"] == "NEW_TECHNICIAN_OFFERED"
    # Alternative technician was selected
    alt_tech_id = tech2["id"] if assigned_tech_id == tech1["id"] else tech1["id"]
    assert reopen_data["fallback"]["technician_id"] == alt_tech_id

    # Verify assignment attempts history has 2 records
    hist = client.get(f"/api/v1/tickets/{ticket['id']}/assignments")
    assert len(hist.json()) == 2


def test_api_demo_c_reopen_with_no_alternative_technician(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "Carpentry"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Bob", "email": "bob@example.com", "phone_number": "+919876543212"},
    ).json()
    tech = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Solo Tech",
            "email": "solo@example.com",
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
            "description": "Wardrobe repair",
            "location": "Tower B",
        },
    ).json()

    assign_res = client.post(f"/api/v1/tickets/{ticket['id']}/assign")
    assignment_id = assign_res.json()["assignment"]["id"]

    client.post(f"/api/v1/assignments/{assignment_id}/accept")
    client.post(f"/api/v1/tickets/{ticket['id']}/arrive")
    client.post(f"/api/v1/tickets/{ticket['id']}/start-work")
    client.post(f"/api/v1/tickets/{ticket['id']}/complete-work")

    # Customer responds: NOT RESOLVED
    reopen_res = client.post(
        f"/api/v1/tickets/{ticket['id']}/customer-response",
        json={
            "was_issue_resolved": False,
            "rating": 2,
            "comment": "Door still loose",
        },
    )
    assert reopen_res.status_code == 200
    data = reopen_res.json()
    assert data["ticket_status"] == "REOPENED"
    assert data["fallback"]["status"] == "NO_ALTERNATIVE_TECHNICIAN_AVAILABLE"


def test_api_invalid_rating_and_invalid_state_rejected(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "Appliances"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Carol", "email": "carol@example.com", "phone_number": "+919876543213"},
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Carol",
            "contact_phone": "+919876543213",
            "description": "Microwave repair",
            "location": "Tower C",
        },
    ).json()

    # 1. Customer response on a ticket still in PENDING -> 400
    res = client.post(
        f"/api/v1/tickets/{ticket['id']}/customer-response",
        json={"was_issue_resolved": True},
    )
    assert res.status_code == 400
    assert "AWAITING_CUSTOMER_CONFIRMATION" in res.json()["detail"]

    # 2. Invalid rating (e.g. 6 or 0) -> 422
    res_invalid_rating = client.post(
        f"/api/v1/tickets/{ticket['id']}/customer-response",
        json={"was_issue_resolved": True, "rating": 6},
    )
    assert res_invalid_rating.status_code == 422
