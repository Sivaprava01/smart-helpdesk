from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field


class ServiceCategoryBase(BaseModel):
    """Shared attributes for Service Category schemas."""

    name: str = Field(..., min_length=1, max_length=100, description="Unique name of the service category")
    is_active: bool = Field(True, description="Whether the service category is active")


class ServiceCategoryCreate(ServiceCategoryBase):
    """Schema for creating a service category."""

    pass


class ServiceCategoryUpdate(BaseModel):
    """Schema for updating a service category."""

    name: str | None = Field(None, min_length=1, max_length=100)
    is_active: bool | None = None


class ServiceCategoryResponse(ServiceCategoryBase):
    """Schema for returning full service category details."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceCategoryBriefResponse(BaseModel):
    """Concise service category details for embedding in technician/ticket responses."""

    id: uuid.UUID
    name: str

    model_config = ConfigDict(from_attributes=True)
