import uuid
from datetime import timedelta
import pytest
from fastapi import Depends, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from smart_helpdesk.api.dependencies import (
    get_current_user,
    require_admin,
    require_admin_or_dispatcher,
    require_customer_or_admin,
    require_technician_or_admin,
    validate_customer_ownership,
    validate_technician_ownership,
)
from smart_helpdesk.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from smart_helpdesk.db.base import Base
from smart_helpdesk.db.enums import UserRole
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.user import User
from smart_helpdesk.db.session import get_db
from smart_helpdesk.main import app
from smart_helpdesk.services.auth_service import AuthService


@pytest.fixture
def auth_client_db() -> tuple[TestClient, Session]:
    """Provides an isolated in-memory DB and TestClient."""
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


def test_password_hashing_and_verification():
    """Verifies that bcrypt password hashing generates secure salts and validates correctly."""
    plain = "SuperSecretPassword123!"
    hashed = get_password_hash(plain)

    assert hashed != plain
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_token_generation_and_decoding():
    """Verifies JWT access and refresh token generation, claims, and type checks."""
    user_id = str(uuid.uuid4())
    access_token = create_access_token({"sub": user_id, "email": "test@example.com", "role": "CUSTOMER"})
    decoded_access = decode_token(access_token)

    assert decoded_access["sub"] == user_id
    assert decoded_access["email"] == "test@example.com"
    assert decoded_access["role"] == "CUSTOMER"
    assert decoded_access["type"] == "access"

    refresh_token = create_refresh_token({"sub": user_id})
    decoded_refresh = decode_token(refresh_token)
    assert decoded_refresh["sub"] == user_id
    assert decoded_refresh["type"] == "refresh"


def test_register_customer_success(auth_client_db):
    """Tests successful customer registration via POST /api/v1/auth/register."""
    client, session = auth_client_db

    payload = {
        "email": "resident@example.com",
        "password": "Password123!",
        "full_name": "Resident One",
        "phone_number": "+1234567890",
        "default_location": "Tower B, Apt 304",
        "age": 28,
    }

    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "resident@example.com"
    assert data["role"] == "CUSTOMER"
    assert data["customer_id"] is not None

    # Verify user and customer entities in DB
    user = session.scalar(select(User).where(User.email == "resident@example.com"))
    assert user is not None
    assert user.hashed_password is not None
    assert verify_password("Password123!", user.hashed_password) is True

    customer = session.scalar(select(Customer).where(Customer.id == user.customer_id))
    assert customer is not None
    assert customer.full_name == "Resident One"
    assert customer.default_location == "Tower B, Apt 304"


def test_register_duplicate_email_fails(auth_client_db):
    """Tests that registering an already existing email returns 400 Bad Request."""
    client, _ = auth_client_db

    payload = {
        "email": "duplicate@example.com",
        "password": "Password123!",
        "full_name": "User One",
        "phone_number": "+1234567890",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


def test_login_success_and_me_endpoint(auth_client_db):
    """Tests user login returning JWT tokens and querying /api/v1/auth/me."""
    client, _ = auth_client_db

    # 1. Register user
    reg_payload = {
        "email": "alice@example.com",
        "password": "StrongPassword123!",
        "full_name": "Alice Resident",
        "phone_number": "+9876543210",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # 2. Login
    login_payload = {
        "email": "alice@example.com",
        "password": "StrongPassword123!",
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()

    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["expires_in"] == 1800
    assert token_data["user"]["email"] == "alice@example.com"

    access_token = token_data["access_token"]

    # 3. Access /auth/me with valid Bearer token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "alice@example.com"
    assert me_data["role"] == "CUSTOMER"

    # 4. Access /auth/me without token fails
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401


def test_login_invalid_credentials_fails(auth_client_db):
    """Tests that incorrect password or non-existent email returns 401 Unauthorized."""
    client, _ = auth_client_db

    # Wrong email
    res1 = client.post("/api/v1/auth/login", json={"email": "nonexistent@example.com", "password": "pass"})
    assert res1.status_code == 401
    assert "Invalid email or password" in res1.json()["detail"]

    # Register user
    client.post(
        "/api/v1/auth/register",
        json={"email": "bob@example.com", "password": "CorrectPassword123!", "full_name": "Bob", "phone_number": "1234567"},
    )

    # Wrong password
    res2 = client.post("/api/v1/auth/login", json={"email": "bob@example.com", "password": "WrongPassword!"})
    assert res2.status_code == 401
    assert "Invalid email or password" in res2.json()["detail"]


def test_refresh_token_flow(auth_client_db):
    """Tests obtaining a new access token using a valid refresh token."""
    client, _ = auth_client_db

    # 1. Register and login
    client.post(
        "/api/v1/auth/register",
        json={"email": "charlie@example.com", "password": "Password123!", "full_name": "Charlie", "phone_number": "5555555"},
    )
    login_res = client.post("/api/v1/auth/login", json={"email": "charlie@example.com", "password": "Password123!"})
    tokens = login_res.json()

    refresh_token = tokens["refresh_token"]

    # 2. Refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens

    # 3. Sending an access token to the refresh endpoint fails
    invalid_type_res = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert invalid_type_res.status_code == 401


def test_logout_endpoint(auth_client_db):
    """Tests that authenticated user can call logout endpoint."""
    client, _ = auth_client_db

    client.post(
        "/api/v1/auth/register",
        json={"email": "logout_user@example.com", "password": "Password123!", "full_name": "Logout", "phone_number": "1112223"},
    )
    login_res = client.post("/api/v1/auth/login", json={"email": "logout_user@example.com", "password": "Password123!"})
    token = login_res.json()["access_token"]

    res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["message"] == "Logged out successfully"


def test_role_based_authorization_guards(auth_client_db):
    """Tests role checking dependencies (ADMIN, DISPATCHER, TECHNICIAN, CUSTOMER)."""
    _, session = auth_client_db

    admin_user = User(email="admin@example.com", role=UserRole.ADMIN, is_active=True)
    dispatcher_user = User(email="dispatcher@example.com", role=UserRole.DISPATCHER, is_active=True)
    technician_user = User(email="tech@example.com", role=UserRole.TECHNICIAN, is_active=True)
    customer_user = User(email="cust@example.com", role=UserRole.CUSTOMER, is_active=True)

    session.add_all([admin_user, dispatcher_user, technician_user, customer_user])
    session.commit()

    # Admin guard
    admin_checker = require_admin
    assert admin_checker(admin_user) == admin_user
    with pytest.raises(HTTPException) as exc1:
        admin_checker(customer_user)
    assert exc1.value.status_code == 403

    # Dispatcher/Admin guard
    dispatcher_checker = require_admin_or_dispatcher
    assert dispatcher_checker(admin_user) == admin_user
    assert dispatcher_checker(dispatcher_user) == dispatcher_user
    with pytest.raises(HTTPException) as exc2:
        dispatcher_checker(technician_user)
    assert exc2.value.status_code == 403

    # Technician guard
    technician_checker = require_technician_or_admin
    assert technician_checker(technician_user) == technician_user
    assert technician_checker(admin_user) == admin_user
    with pytest.raises(HTTPException) as exc3:
        technician_checker(customer_user)
    assert exc3.value.status_code == 403


def test_technician_and_customer_ownership_validation():
    """Tests ownership boundary validation for technicians and customers."""
    tech_id_1 = uuid.uuid4()
    tech_id_2 = uuid.uuid4()

    cust_id_1 = uuid.uuid4()
    cust_id_2 = uuid.uuid4()

    tech_user = User(email="tech1@example.com", role=UserRole.TECHNICIAN, technician_id=tech_id_1)
    admin_user = User(email="admin@example.com", role=UserRole.ADMIN)
    cust_user = User(email="cust1@example.com", role=UserRole.CUSTOMER, customer_id=cust_id_1)

    # Technician ownership
    validate_technician_ownership(tech_user, tech_id_1)  # own ID -> ok
    validate_technician_ownership(admin_user, tech_id_2)  # admin -> ok
    with pytest.raises(HTTPException) as exc1:
        validate_technician_ownership(tech_user, tech_id_2)  # other tech -> 403
    assert exc1.value.status_code == 403

    # Customer ownership
    validate_customer_ownership(cust_user, cust_id_1)  # own ID -> ok
    validate_customer_ownership(admin_user, cust_id_2)  # admin -> ok
    with pytest.raises(HTTPException) as exc2:
        validate_customer_ownership(cust_user, cust_id_2)  # other customer -> 403
    assert exc2.value.status_code == 403


def test_google_oauth_url_and_user_creation(auth_client_db):
    """Tests Google OAuth consent URL generation and OAuth user provisioning."""
    client, session = auth_client_db

    # 1. URL endpoint
    url_res = client.get("/api/v1/auth/oauth/google/url")
    assert url_res.status_code == 200
    assert "accounts.google.com" in url_res.json()["authorization_url"]

    # 2. Service provisioning
    oauth_user = AuthService.create_or_link_oauth_user(
        db=session,
        email="google_resident@gmail.com",
        oauth_provider="google",
        oauth_id="google-sub-123456",
        full_name="Google User",
    )
    assert oauth_user.email == "google_resident@gmail.com"
    assert oauth_user.oauth_provider == "google"
    assert oauth_user.oauth_id == "google-sub-123456"
    assert oauth_user.is_verified is True
    assert oauth_user.customer_id is not None
