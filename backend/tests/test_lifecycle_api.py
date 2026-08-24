from datetime import datetime, timedelta, timezone
import uuid
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.db.base import Base
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


def test_update_ticket_allowed_fields(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "John Doe", "email": "john@example.com", "phone_number": "+919800000001"},
    ).json()
    cat1 = client.post("/api/v1/categories", json={"name": "Plumbing"}).json()
    cat2 = client.post("/api/v1/categories", json={"name": "Electrical"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat1["id"],
            "contact_name": "John Doe",
            "contact_phone": "+919800000001",
            "description": "Kitchen tap leak issue",
            "location": "Tower A, Flat 101",
        },
    ).json()
    ticket_id = ticket["id"]

    # Update description, location, contact name, and switch category
    patch_res = client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={
            "description": "Kitchen sink main line pipe leaking heavily",
            "location": "Tower A, Flat 101 (Kitchen)",
            "contact_name": "John Doe Jr",
            "category_id": cat2["id"],
        },
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["description"] == "Kitchen sink main line pipe leaking heavily"
    assert updated_data["location"] == "Tower A, Flat 101 (Kitchen)"
    assert updated_data["contact_name"] == "John Doe Jr"
    assert updated_data["category_id"] == cat2["id"]
    assert updated_data["status"] == "PENDING"


def test_update_ticket_scheduling(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Jane Doe", "email": "jane@example.com", "phone_number": "+919800000002"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Cleaning"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Jane",
            "contact_phone": "+919800000002",
            "description": "Full flat deep cleaning needed",
            "location": "Tower B, Flat 202",
            "is_scheduled": False,
        },
    ).json()
    ticket_id = ticket["id"]

    # Switch from ASAP to scheduled
    future_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    patch_res = client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={
            "is_scheduled": True,
            "scheduled_for": future_time,
        },
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_scheduled"] is True
    assert patch_res.json()["scheduled_for"] is not None


def test_client_cannot_arbitrarily_set_status(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Sam", "email": "sam@example.com", "phone_number": "+919800000003"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "HVAC"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Sam",
            "contact_phone": "+919800000003",
            "description": "AC filter cleaning needed",
            "location": "Tower C, Flat 303",
        },
    ).json()
    ticket_id = ticket["id"]

    # Attempting to inject "status": "RESOLVED"
    patch_res = client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "RESOLVED", "description": "Attempted bypass"},
    )
    assert patch_res.status_code == 200
    # Status MUST remain PENDING because status is not an accepted update field
    assert patch_res.json()["status"] == "PENDING"
    assert patch_res.json()["description"] == "Attempted bypass"


def test_cancel_pending_ticket_success(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Tom", "email": "tom@example.com", "phone_number": "+919800000004"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Appliance"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Tom",
            "contact_phone": "+919800000004",
            "description": "Washing machine not spinning",
            "location": "Tower D, Flat 404",
        },
    ).json()
    ticket_id = ticket["id"]

    # Cancel ticket
    cancel_res = client.post(f"/api/v1/tickets/{ticket_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # Verify status endpoint reflects CANCELLED
    status_res = client.get(f"/api/v1/tickets/{ticket_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "CANCELLED"

    # Re-cancelling must fail cleanly with 400
    repeat_cancel = client.post(f"/api/v1/tickets/{ticket_id}/cancel")
    assert repeat_cancel.status_code == 400
    assert "already cancelled" in repeat_cancel.json()["detail"]


def test_cannot_update_cancelled_ticket(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Victor", "email": "victor@example.com", "phone_number": "+919800000005"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Painting"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Victor",
            "contact_phone": "+919800000005",
            "description": "Living room touch up paint",
            "location": "Tower E, Flat 505",
        },
    ).json()
    ticket_id = ticket["id"]

    # Cancel first
    client.post(f"/api/v1/tickets/{ticket_id}/cancel")

    # Attempt to update cancelled ticket -> 400
    patch_res = client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"description": "Trying to edit after cancellation"},
    )
    assert patch_res.status_code == 400
    assert "Cannot edit ticket" in patch_res.json()["detail"]


def test_tickets_have_no_delete_endpoint(client_with_db: tuple[TestClient, Session]) -> None:
    """Verifies that tickets cannot be permanently deleted (405 Method Not Allowed)."""
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Wendy", "email": "wendy@example.com", "phone_number": "+919800000006"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Carpentry"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Wendy",
            "contact_phone": "+919800000006",
            "description": "Door handle fix",
            "location": "Tower F, Flat 606",
        },
    ).json()

    # Attempt DELETE HTTP verb
    delete_res = client.delete(f"/api/v1/tickets/{ticket['id']}")
    assert delete_res.status_code == 405
