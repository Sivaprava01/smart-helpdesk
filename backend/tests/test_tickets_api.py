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


def test_create_asap_ticket_success(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Siva", "email": "siva@example.com", "phone_number": "+919876543210"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Plumbing"}).json()

    payload = {
        "customer_id": cust["id"],
        "category_id": cat["id"],
        "contact_name": "Siva",
        "contact_phone": "+919876543210",
        "description": "Water is clogged in my washroom",
        "location": "Tower A, Flat 302",
        "is_scheduled": False,
        "scheduled_for": None,
    }
    response = client.post("/api/v1/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["customer_id"] == cust["id"]
    assert data["category_id"] == cat["id"]
    assert data["status"] == "PENDING"
    assert data["is_scheduled"] is False
    assert data["scheduled_for"] is None
    assert data["category"]["name"] == "Plumbing"
    assert data["customer"]["full_name"] == "Siva"


def test_create_scheduled_ticket_success(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Alice", "email": "alice@example.com", "phone_number": "+919876543211"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Electrical"}).json()

    future_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    payload = {
        "customer_id": cust["id"],
        "category_id": cat["id"],
        "contact_name": "Alice",
        "contact_phone": "+919876543211",
        "description": "Power socket sparks in the kitchen",
        "location": "Tower B, Flat 105",
        "is_scheduled": True,
        "scheduled_for": future_time,
    }
    response = client.post("/api/v1/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["is_scheduled"] is True
    assert data["scheduled_for"] is not None
    assert data["status"] == "PENDING"


def test_create_scheduled_ticket_missing_time_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Bob", "email": "bob@example.com", "phone_number": "+919876543212"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Cleaning"}).json()

    payload = {
        "customer_id": cust["id"],
        "category_id": cat["id"],
        "contact_name": "Bob",
        "contact_phone": "+919876543212",
        "description": "Deep cleaning needed for bedroom",
        "location": "Tower C, Flat 401",
        "is_scheduled": True,
        "scheduled_for": None,
    }
    response = client.post("/api/v1/tickets", json=payload)
    assert response.status_code == 422


def test_create_asap_ticket_with_time_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Carol", "email": "carol@example.com", "phone_number": "+919876543213"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "HVAC"}).json()

    future_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    payload = {
        "customer_id": cust["id"],
        "category_id": cat["id"],
        "contact_name": "Carol",
        "contact_phone": "+919876543213",
        "description": "AC unit needs maintenance check",
        "location": "Tower D, Flat 202",
        "is_scheduled": False,
        "scheduled_for": future_time,
    }
    response = client.post("/api/v1/tickets", json=payload)
    assert response.status_code == 422


def test_create_scheduled_ticket_past_time_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "David", "email": "david@example.com", "phone_number": "+919876543214"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Appliance"}).json()

    past_time = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    payload = {
        "customer_id": cust["id"],
        "category_id": cat["id"],
        "contact_name": "David",
        "contact_phone": "+919876543214",
        "description": "Microwave repair requested",
        "location": "Tower E, Flat 601",
        "is_scheduled": True,
        "scheduled_for": past_time,
    }
    response = client.post("/api/v1/tickets", json=payload)
    assert response.status_code == 422


def test_create_ticket_nonexistent_references(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Eva", "email": "eva@example.com", "phone_number": "+919876543215"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "Pest Control"}).json()

    # Nonexistent customer
    res_bad_cust = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": str(uuid.uuid4()),
            "category_id": cat["id"],
            "contact_name": "Eva",
            "contact_phone": "+919876543215",
            "description": "Pest control needed in balcony",
            "location": "Tower F, Flat 101",
        },
    )
    assert res_bad_cust.status_code == 404

    # Nonexistent category
    res_bad_cat = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": str(uuid.uuid4()),
            "contact_name": "Eva",
            "contact_phone": "+919876543215",
            "description": "Pest control needed in balcony",
            "location": "Tower F, Flat 101",
        },
    )
    assert res_bad_cat.status_code == 404


def test_create_ticket_inactive_category_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Frank", "email": "frank@example.com", "phone_number": "+919876543216"},
    ).json()
    cat = client.post(
        "/api/v1/categories",
        json={"name": "Discontinued Service", "is_active": False},
    ).json()

    response = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Frank",
            "contact_phone": "+919876543216",
            "description": "Requesting discontinued service",
            "location": "Tower G, Flat 802",
        },
    )
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"]


def test_get_ticket_and_status(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust = client.post(
        "/api/v1/customers",
        json={"full_name": "Grace", "email": "grace@example.com", "phone_number": "+919876543217"},
    ).json()
    cat = client.post("/api/v1/categories", json={"name": "General Maintenance"}).json()

    ticket = client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust["id"],
            "category_id": cat["id"],
            "contact_name": "Grace",
            "contact_phone": "+919876543217",
            "description": "Balcony door latch loose",
            "location": "Tower H, Flat 303",
        },
    ).json()

    # Get ticket full
    get_res = client.get(f"/api/v1/tickets/{ticket['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["description"] == "Balcony door latch loose"

    # Get ticket status
    status_res = client.get(f"/api/v1/tickets/{ticket['id']}/status")
    assert status_res.status_code == 200
    assert status_res.json()["ticket_id"] == ticket["id"]
    assert status_res.json()["status"] == "PENDING"


def test_list_tickets_and_filters(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cust1 = client.post(
        "/api/v1/customers",
        json={"full_name": "Henry", "email": "henry@example.com", "phone_number": "+919876543218"},
    ).json()
    cust2 = client.post(
        "/api/v1/customers",
        json={"full_name": "Iris", "email": "iris@example.com", "phone_number": "+919876543219"},
    ).json()
    cat1 = client.post("/api/v1/categories", json={"name": "Plumbing Service"}).json()

    client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust1["id"],
            "category_id": cat1["id"],
            "contact_name": "Henry",
            "contact_phone": "+919876543218",
            "description": "Kitchen tap leak",
            "location": "Tower J, Flat 101",
        },
    )
    client.post(
        "/api/v1/tickets",
        json={
            "customer_id": cust2["id"],
            "category_id": cat1["id"],
            "contact_name": "Iris",
            "contact_phone": "+919876543219",
            "description": "Bathroom pipe leak",
            "location": "Tower J, Flat 102",
        },
    )

    res_all = client.get("/api/v1/tickets")
    assert res_all.status_code == 200
    assert len(res_all.json()) == 2

    res_cust1 = client.get(f"/api/v1/tickets?customer_id={cust1['id']}")
    assert res_cust1.status_code == 200
    assert len(res_cust1.json()) == 1
    assert res_cust1.json()[0]["customer_id"] == cust1["id"]
