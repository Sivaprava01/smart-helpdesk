import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from smart_helpdesk.core.config import get_settings
from smart_helpdesk.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from smart_helpdesk.db.enums import UserRole
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.user import User
from smart_helpdesk.schemas.auth import (
    TokenResponse,
    UserRegisterRequest,
    UserResponse,
)


class AuthService:
    """Service handling user registration, authentication, JWT token generation, and OAuth linking."""

    @staticmethod
    def register_customer(db: Session, data: UserRegisterRequest) -> User:
        """Registers a new customer user and links or creates their Customer entity."""
        normalized_email = data.email.lower().strip()

        # 1. Check if user already exists
        existing_user = db.scalar(select(User).where(User.email == normalized_email))
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address is already registered.",
            )

        # 2. Find or create Customer domain entity
        customer = db.scalar(select(Customer).where(Customer.email == normalized_email))
        if not customer:
            customer = Customer(
                full_name=data.full_name.strip(),
                email=normalized_email,
                phone_number=data.phone_number.strip(),
                default_location=data.default_location.strip() if data.default_location else "Tower A, Apt 101",
                age=data.age,
            )
            db.add(customer)
            db.flush()

        # 3. Create User account
        hashed_password = get_password_hash(data.password)
        user = User(
            email=normalized_email,
            hashed_password=hashed_password,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=False,
            customer_id=customer.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """Authenticates user credentials and returns the active User."""
        normalized_email = email.lower().strip()
        user = db.scalar(select(User).where(User.email == normalized_email))

        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user account is inactive. Please contact system administration.",
            )

        return user

    @staticmethod
    def generate_token_response(user: User) -> TokenResponse:
        """Builds a TokenResponse containing access token, refresh token, and user metadata."""
        settings = get_settings()

        # Access token payload
        access_payload = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "customer_id": str(user.customer_id) if user.customer_id else None,
            "technician_id": str(user.technician_id) if user.technician_id else None,
        }
        access_token = create_access_token(access_payload)

        # Refresh token payload
        refresh_payload = {
            "sub": str(user.id),
        }
        refresh_token = create_refresh_token(refresh_payload)

        expires_in = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    def refresh_tokens(db: Session, refresh_token_str: str) -> TokenResponse:
        """Validates a refresh token and generates a new token pair."""
        try:
            payload = decode_token(refresh_token_str)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type provided for refresh endpoint.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing subject claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID format in token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.scalar(select(User).where(User.id == user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User associated with this refresh token is inactive or not found.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthService.generate_token_response(user)

    @staticmethod
    def create_or_link_oauth_user(
        db: Session,
        email: str,
        oauth_provider: str,
        oauth_id: str,
        full_name: str | None = None,
    ) -> User:
        """Finds existing user by email/oauth_id or provisions a new customer user account."""
        normalized_email = email.lower().strip()
        user = db.scalar(select(User).where(User.email == normalized_email))

        if user:
            # Update OAuth attributes if not previously linked
            if not user.oauth_provider:
                user.oauth_provider = oauth_provider
                user.oauth_id = oauth_id
            user.is_verified = True
            db.commit()
            db.refresh(user)
            return user

        # Find or create customer entity
        customer = db.scalar(select(Customer).where(Customer.email == normalized_email))
        if not customer:
            customer = Customer(
                full_name=full_name.strip() if full_name else "Google Resident",
                email=normalized_email,
                phone_number="+1000000000",
                default_location="Tower A",
            )
            db.add(customer)
            db.flush()

        # Create new OAuth user
        user = User(
            email=normalized_email,
            hashed_password=None,
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True,
            oauth_provider=oauth_provider,
            oauth_id=oauth_id,
            customer_id=customer.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
