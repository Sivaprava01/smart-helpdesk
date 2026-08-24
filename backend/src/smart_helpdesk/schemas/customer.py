from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerBase(BaseModel):
    """Shared attributes for Customer schemas."""

    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the customer")
    email: EmailStr = Field(..., description="Unique email address")
    phone_number: str = Field(..., min_length=5, max_length=50, description="Unique contact phone number")
    age: int | None = Field(None, ge=1, le=130, description="Age of the customer")
    default_location: str | None = Field(None, max_length=500, description="Default residential location")


class CustomerCreate(CustomerBase):
    """Schema for creating a new customer."""

    pass


class CustomerUpdate(BaseModel):
    """Schema for updating an existing customer (partial update)."""

    full_name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(None, min_length=5, max_length=50)
    age: int | None = Field(None, ge=1, le=130)
    default_location: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class CustomerResponse(CustomerBase):
    """Schema for returning full customer details."""

    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerBriefResponse(BaseModel):
    """Concise customer details for nested embedding in ticket responses."""

    id: uuid.UUID
    full_name: str
    email: str
    phone_number: str

    model_config = ConfigDict(from_attributes=True)
