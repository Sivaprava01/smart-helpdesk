import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from smart_helpdesk.db.enums import UserRole


class UserRegisterRequest(BaseModel):
    """Registration request payload for a new customer account."""

    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=8, description="Account password (min 8 chars)")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full customer name")
    phone_number: str = Field(..., min_length=7, max_length=20, description="Contact phone number")
    default_location: str | None = Field(default="Tower A, Apt 101", description="Default unit or apartment")
    age: int | None = Field(default=None, ge=18, le=120, description="Customer age")


class UserLoginRequest(BaseModel):
    """Login request payload."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class RefreshTokenRequest(BaseModel):
    """Refresh token request payload."""

    refresh_token: str = Field(..., description="Valid JWT refresh token")


class UserResponse(BaseModel):
    """Public user response schema."""

    id: uuid.UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    oauth_provider: str | None = None
    customer_id: uuid.UUID | None = None
    technician_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT access and refresh token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token expiration duration in seconds")
    user: UserResponse


class OAuthUrlResponse(BaseModel):
    """OAuth consent URL response."""

    authorization_url: str
    provider: str = "google"


class OAuthCallbackRequest(BaseModel):
    """OAuth callback authorization code or credential token."""

    code: str | None = Field(default=None, description="OAuth authorization code from redirect")
    credential: str | None = Field(default=None, description="Google Identity Services ID token")
    redirect_uri: str | None = Field(default=None, description="Redirect URI matching authorization request")
