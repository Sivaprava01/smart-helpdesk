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


def test_create_customer_success(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    payload = {
        "full_name": "Siva",
        "email": "siva@example.com",
        "phone_number": "+919876543210",
        "age": 21,
        "default_location": "Tower A, Flat 302",
    }
    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Siva"
    assert data["email"] == "siva@example.com"
    assert data["phone_number"] == "+919876543210"
    assert data["age"] == 21
    assert data["is_active"] is True
    assert "id" in data


def test_create_customer_invalid_email(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    payload = {
        "full_name": "Invalid Email",
        "email": "not-an-email",
        "phone_number": "+919876543210",
    }
    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 422


def test_create_customer_duplicate_email(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    payload1 = {
        "full_name": "User 1",
        "email": "duplicate@example.com",
        "phone_number": "+919876543210",
    }
    client.post("/api/v1/customers", json=payload1)

    payload2 = {
        "full_name": "User 2",
        "email": "duplicate@example.com",
        "phone_number": "+919876543211",
    }
    response = client.post("/api/v1/customers", json=payload2)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_get_customer_success(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    create_res = client.post(
        "/api/v1/customers",
        json={
            "full_name": "Alice Smith",
            "email": "alice@example.com",
            "phone_number": "+15551234567",
        },
    )
    customer_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/customers/{customer_id}")
    assert get_res.status_code == 200
    assert get_res.json()["email"] == "alice@example.com"


def test_get_customer_not_found(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/customers/{non_existent_id}")
    assert response.status_code == 404


def test_list_customers(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    for i in range(3):
        client.post(
            "/api/v1/customers",
            json={
                "full_name": f"Resident {i}",
                "email": f"resident{i}@example.com",
                "phone_number": f"+91987654321{i}",
            },
        )

    response = client.get("/api/v1/customers?skip=0&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_update_customer(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    create_res = client.post(
        "/api/v1/customers",
        json={
            "full_name": "Bob",
            "email": "bob@example.com",
            "phone_number": "+15559998888",
        },
    )
    customer_id = create_res.json()["id"]

    patch_res = client.patch(
        f"/api/v1/customers/{customer_id}",
        json={"default_location": "Tower B, Flat 501", "age": 45},
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["default_location"] == "Tower B, Flat 501"
    assert data["age"] == 45
    assert data["full_name"] == "Bob"
