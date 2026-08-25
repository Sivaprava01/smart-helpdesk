from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from smart_helpdesk.api.dependencies import get_current_user
from smart_helpdesk.db.models.user import User
from smart_helpdesk.db.session import get_db
from smart_helpdesk.schemas.auth import (
    OAuthCallbackRequest,
    OAuthUrlResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from smart_helpdesk.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
    description="Registers a new resident/customer account, creates/links their Customer record, and sets up authentication.",
)
def register(
    data: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Creates a new customer user and returns the user profile."""
    user = AuthService.register_customer(db, data)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User login with email and password",
    description="Authenticates user credentials and returns JWT access and refresh token pair.",
)
def login(
    data: UserLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticates credentials and returns JWT access and refresh tokens."""
    user = AuthService.authenticate_user(db, data.email, data.password)
    return AuthService.generate_token_response(user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Exchanges a valid long-lived refresh token for a new access and refresh token pair.",
)
def refresh(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Validates refresh token and issues fresh token pair."""
    return AuthService.refresh_tokens(db, data.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Returns the profile and linked domain entity metadata for the currently authenticated user.",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Returns profile for currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user session",
    description="Standardized logout endpoint for client session termination.",
)
def logout(
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Logs out current user session."""
    return {"message": "Logged out successfully"}


@router.get(
    "/oauth/google/url",
    response_model=OAuthUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Google OAuth authorization URL",
    description="Returns the Google OAuth consent URL for frontend redirection.",
)
def get_google_oauth_url() -> OAuthUrlResponse:
    """Generates the Google OAuth2 consent URL."""
    url = AuthService.get_google_auth_url()
    return OAuthUrlResponse(authorization_url=url, provider="google")


@router.post(
    "/oauth/google/callback",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Process Google OAuth callback",
    description="Exchanges Google auth code or ID token credential, creates or links account, and returns JWT tokens.",
)
def google_oauth_callback(
    data: OAuthCallbackRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Processes Google OAuth callback and returns JWT session tokens."""
    return AuthService.process_google_oauth_callback(
        db=db,
        code=data.code,
        credential=data.credential,
        redirect_uri=data.redirect_uri,
    )
