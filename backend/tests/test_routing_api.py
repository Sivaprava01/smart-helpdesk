from decimal import Decimal
import uuid
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
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


def test_routing_preview_complete_flow(client_with_db: tuple[TestClient, Session]) -> None:
    client, session = client_with_db

    # 1. Categories
    cat_plumb = client.post("/api/v1/categories", json={"name": "Plumbing"}).json()
    cat_elec = client.post("/api/v1/categories", json={"name": "Electrical"}).json()

    # 2. Customer
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Siva", "email": "siva@example.com", "phone_number": "+919876543210"},
    ).json()

    # 3. Ticket
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat_plumb["id"],
            "contact_name": "Siva",
            "contact_phone": "+919876543210",
            "description": "Water is clogged in my washroom",
            "location": "Tower A, Flat 302",
        },
    ).json()
    ticket_id = ticket["id"]

    # 4. Technicians:
    # Tech A (Ravi: on duty, plumbing, tower A, high rating)
    res_ravi = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Ravi",
            "email": "ravi@example.com",
            "phone_number": "+919999999901",
            "is_on_duty": True,
            "current_zone": "Tower A",
            "max_workload": 5,
            "category_ids": [cat_plumb["id"]],
        },
    ).json()
    ravi_id = res_ravi["id"]

    # Tech B (Suresh: on duty, plumbing, tower D)
    res_suresh = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Suresh",
            "email": "suresh@example.com",
            "phone_number": "+919999999902",
            "is_on_duty": True,
            "current_zone": "Tower D",
            "max_workload": 5,
            "category_ids": [cat_plumb["id"]],
        },
    ).json()
    suresh_id = res_suresh["id"]

    # Tech C (Anil: off duty plumber -> excluded)
    client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Anil",
            "email": "anil@example.com",
            "phone_number": "+919999999903",
            "is_on_duty": False,
            "category_ids": [cat_plumb["id"]],
        },
    )

    # Tech D (Kumar: electrical only -> excluded)
    client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Kumar",
            "email": "kumar@example.com",
            "phone_number": "+919999999904",
            "is_on_duty": True,
            "category_ids": [cat_elec["id"]],
        },
    )

    # Add positive history for customer and Ravi directly in DB
    history = CustomerTechnicianHistory(
        customer_id=uuid.UUID(cust["id"]),
        technician_id=uuid.UUID(ravi_id),
        positive_interactions=3,
        negative_interactions=0,
    )
    session.add(history)
    session.commit()

    # 5. Call POST routing preview
    preview_res = client.post(f"/api/v1/tickets/{ticket_id}/routing-preview")
    assert preview_res.status_code == 200
    data = preview_res.json()

    assert data["ticket_id"] == ticket_id
    assert data["ticket_category"] == "Plumbing"
    assert data["technicians_considered"] == 4
    assert data["eligible_count"] == 2
    assert len(data["excluded_candidates"]) == 2
    assert len(data["ranked_candidates"]) == 2

    # Verify exclusions
    excluded_by_name = {e["technician_name"]: e["reasons"] for e in data["excluded_candidates"]}
    assert "Anil" in excluded_by_name
    assert "TECHNICIAN_OFF_DUTY" in excluded_by_name["Anil"]
    assert "Kumar" in excluded_by_name
    assert "CATEGORY_NOT_SUPPORTED" in excluded_by_name["Kumar"]

    # Verify ranking
    assert data["ranked_candidates"][0]["technician_id"] == ravi_id
    assert data["ranked_candidates"][0]["rank"] == 1
    assert data["ranked_candidates"][0]["technician_name"] == "Ravi"
    assert data["ranked_candidates"][1]["technician_id"] == suresh_id
    assert data["ranked_candidates"][1]["rank"] == 2

    # Verify score breakdown presence
    breakdown = data["ranked_candidates"][0]["score_breakdown"]
    assert "location" in breakdown
    assert "rating" in breakdown
    assert "customer_history" in breakdown
    assert "reopen_rate" in breakdown
    assert "workload" in breakdown

    # Verify recommendation
    assert data["recommended_technician"]["technician_id"] == ravi_id
    assert data["recommended_technician"]["technician_name"] == "Ravi"


def test_routing_preview_get_and_post_parity(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cat = client.post("/api/v1/categories", json={"name": "Carpentry"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Carol", "email": "carol@example.com", "phone_number": "+919876543299"},
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Carol",
            "contact_phone": "+919876543299",
            "description": "Fix wooden wardrobe hinge",
            "location": "Tower B, Flat 101",
        },
    ).json()

    res_post = client.post(f"/api/v1/tickets/{ticket['id']}/routing-preview")
    res_get = client.get(f"/api/v1/tickets/{ticket['id']}/routing-preview")

    assert res_post.status_code == 200
    assert res_get.status_code == 200
    assert res_post.json() == res_get.json()


def test_routing_preview_nonexistent_ticket_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    res = client.post(f"/api/v1/tickets/{uuid.uuid4()}/routing-preview")
    assert res.status_code == 404


def test_routing_preview_cancelled_ticket_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cat = client.post("/api/v1/categories", json={"name": "Pest Control"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Dan", "email": "dan@example.com", "phone_number": "+919876543288"},
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Dan",
            "contact_phone": "+919876543288",
            "description": "Balcony pest treatment",
            "location": "Tower C, Flat 201",
        },
    ).json()

    # Cancel ticket
    client.post(f"/api/v1/tickets/{ticket['id']}/cancel")

    # Routing preview must fail
    res = client.post(f"/api/v1/tickets/{ticket['id']}/routing-preview")
    assert res.status_code == 400
    assert "CANCELLED" in res.json()["detail"]


def test_routing_preview_is_strictly_read_only(client_with_db: tuple[TestClient, Session]) -> None:
    client, session = client_with_db

    cat = client.post("/api/v1/categories", json={"name": "HVAC"}).json()
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Emma", "email": "emma@example.com", "phone_number": "+919876543277"},
    ).json()
    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Emma",
            "contact_phone": "+919876543277",
            "description": "AC filter service",
            "location": "Tower E, Flat 501",
        },
    ).json()
    ticket_id = ticket["id"]

    client.post(
        "/api/v1/technicians",
        json={
            "full_name": "HVAC Specialist",
            "email": "hvac@example.com",
            "phone_number": "+919999999905",
            "is_on_duty": True,
            "category_ids": [cat["id"]],
        },
    )

    # 1. Assert no assignments before
    assignments_before = session.execute(select(TechnicianAssignment)).scalars().all()
    assert len(assignments_before) == 0

    # 2. Run preview multiple times
    res1 = client.post(f"/api/v1/tickets/{ticket_id}/routing-preview")
    res2 = client.post(f"/api/v1/tickets/{ticket_id}/routing-preview")
    assert res1.json() == res2.json()

    # 3. Assert no assignments created
    assignments_after = session.execute(select(TechnicianAssignment)).scalars().all()
    assert len(assignments_after) == 0

    # 4. Assert ticket status is still PENDING
    db_ticket = session.get(Ticket, uuid.UUID(ticket_id))
    assert db_ticket is not None
    assert db_ticket.status == TicketStatus.PENDING
