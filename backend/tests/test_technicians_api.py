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


def test_create_technician_with_categories(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cat_res = client.post("/api/v1/categories", json={"name": "Plumbing"})
    category_id = cat_res.json()["id"]

    tech_payload = {
        "full_name": "Ravi Kumar",
        "email": "ravi@example.com",
        "phone_number": "+919999999999",
        "is_on_duty": True,
        "max_workload": 5,
        "category_ids": [category_id],
    }
    response = client.post("/api/v1/technicians", json=tech_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Ravi Kumar"
    assert data["email"] == "ravi@example.com"
    assert data["is_on_duty"] is True
    assert data["max_workload"] == 5
    assert data["current_workload"] == 0
    assert len(data["categories"]) == 1
    assert data["categories"][0]["id"] == category_id
    assert data["categories"][0]["name"] == "Plumbing"


def test_create_technician_nonexistent_category_fails(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    non_existent_category_id = str(uuid.uuid4())

    tech_payload = {
        "full_name": "Ghost Tech",
        "email": "ghost@example.com",
        "phone_number": "+919999999998",
        "category_ids": [non_existent_category_id],
    }
    response = client.post("/api/v1/technicians", json=tech_payload)
    assert response.status_code == 404
    assert "service categories not found" in response.json()["detail"]


def test_create_technician_duplicate_email(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    payload1 = {
        "full_name": "Tech 1",
        "email": "duplicate.tech@example.com",
        "phone_number": "+919999999901",
    }
    client.post("/api/v1/technicians", json=payload1)

    payload2 = {
        "full_name": "Tech 2",
        "email": "duplicate.tech@example.com",
        "phone_number": "+919999999902",
    }
    response = client.post("/api/v1/technicians", json=payload2)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_get_technician_success_and_not_found(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    create_res = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Amit Sharma",
            "email": "amit@example.com",
            "phone_number": "+919888888888",
        },
    )
    tech_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/technicians/{tech_id}")
    assert get_res.status_code == 200
    assert get_res.json()["full_name"] == "Amit Sharma"

    not_found_res = client.get(f"/api/v1/technicians/{uuid.uuid4()}")
    assert not_found_res.status_code == 404


def test_list_technicians_and_filters(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cat_elec = client.post("/api/v1/categories", json={"name": "Electrical"}).json()["id"]
    cat_plumb = client.post("/api/v1/categories", json={"name": "Plumbing"}).json()["id"]

    # Tech 1: on duty, electrical
    client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Electrician 1",
            "email": "elec1@example.com",
            "phone_number": "+911111111111",
            "is_on_duty": True,
            "category_ids": [cat_elec],
        },
    )
    # Tech 2: off duty, plumbing
    client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Plumber 1",
            "email": "plumb1@example.com",
            "phone_number": "+912222222222",
            "is_on_duty": False,
            "category_ids": [cat_plumb],
        },
    )

    res_all = client.get("/api/v1/technicians")
    assert res_all.status_code == 200
    assert len(res_all.json()) == 2

    res_on_duty = client.get("/api/v1/technicians?is_on_duty=true")
    assert res_on_duty.status_code == 200
    assert len(res_on_duty.json()) == 1
    assert res_on_duty.json()[0]["full_name"] == "Electrician 1"

    res_category = client.get(f"/api/v1/technicians?category_id={cat_plumb}")
    assert res_category.status_code == 200
    assert len(res_category.json()) == 1
    assert res_category.json()[0]["full_name"] == "Plumber 1"


def test_update_technician_skills_and_status(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    cat1 = client.post("/api/v1/categories", json={"name": "Carpentry"}).json()["id"]
    cat2 = client.post("/api/v1/categories", json={"name": "Painting"}).json()["id"]

    create_res = client.post(
        "/api/v1/technicians",
        json={
            "full_name": "Multi Tech",
            "email": "multi@example.com",
            "phone_number": "+913333333333",
            "category_ids": [cat1],
        },
    )
    tech_id = create_res.json()["id"]

    patch_res = client.patch(
        f"/api/v1/technicians/{tech_id}",
        json={
            "is_on_duty": True,
            "max_workload": 8,
            "category_ids": [cat1, cat2],
        },
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["is_on_duty"] is True
    assert data["max_workload"] == 8
    assert len(data["categories"]) == 2
