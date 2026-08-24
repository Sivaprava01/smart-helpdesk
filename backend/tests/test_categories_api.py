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


def test_create_category_success(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    response = client.post("/api/v1/categories", json={"name": "Plumbing", "is_active": True})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Plumbing"
    assert data["is_active"] is True
    assert "id" in data


def test_create_category_duplicate_rejected(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    client.post("/api/v1/categories", json={"name": "Electrical"})
    response = client.post("/api/v1/categories", json={"name": "electrical "})
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_list_and_filter_categories(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    client.post("/api/v1/categories", json={"name": "HVAC", "is_active": True})
    client.post("/api/v1/categories", json={"name": "Pest Control", "is_active": False})

    res_all = client.get("/api/v1/categories")
    assert res_all.status_code == 200
    assert len(res_all.json()) == 2

    res_active = client.get("/api/v1/categories?is_active=true")
    assert res_active.status_code == 200
    assert len(res_active.json()) == 1
    assert res_active.json()[0]["name"] == "HVAC"


def test_get_and_update_category(client_with_db: tuple[TestClient, Session]) -> None:
    client, _ = client_with_db
    create_res = client.post("/api/v1/categories", json={"name": "Carpentry"})
    cat_id = create_res.json()["id"]

    get_res = client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Carpentry"

    patch_res = client.patch(f"/api/v1/categories/{cat_id}", json={"name": "Woodwork & Carpentry"})
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Woodwork & Carpentry"
