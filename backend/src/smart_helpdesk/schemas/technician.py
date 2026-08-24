from datetime import datetime
from decimal import Decimal
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from smart_helpdesk.schemas.service_category import ServiceCategoryBriefResponse


class TechnicianBase(BaseModel):
    """Shared attributes for Technician schemas."""

    full_name: str = Field(..., min_length=1, max_length=255, description="Full name of the technician")
    email: EmailStr = Field(..., description="Unique email address")
    phone_number: str = Field(..., min_length=5, max_length=50, description="Unique contact phone number")
    is_on_duty: bool = Field(False, description="Whether the technician is currently available for work")
    current_zone: str | None = Field(None, max_length=100, description="Current residential or service zone (e.g. Tower A)")
    max_workload: int = Field(5, ge=1, le=50, description="Maximum concurrent active jobs permitted")


class TechnicianCreate(TechnicianBase):
    """Schema for creating a new technician with skill category IDs."""

    category_ids: list[uuid.UUID] = Field(
        default_factory=list,
        description="List of valid service category UUIDs supported by this technician",
    )


class TechnicianUpdate(BaseModel):
    """Schema for updating an existing technician."""

    full_name: str | None = Field(None, min_length=1, max_length=255)
    phone_number: str | None = Field(None, min_length=5, max_length=50)
    is_active: bool | None = None
    is_on_duty: bool | None = None
    current_zone: str | None = Field(None, max_length=100)
    max_workload: int | None = Field(None, ge=1, le=50)
    category_ids: list[uuid.UUID] | None = Field(
        None,
        description="Replace list of service category UUIDs supported by this technician",
    )


class TechnicianResponse(TechnicianBase):
    """Schema for returning full technician details."""

    id: uuid.UUID
    is_active: bool
    current_workload: int
    overall_rating: Decimal | None
    completed_jobs_count: int
    reopened_jobs_count: int
    categories: list[ServiceCategoryBriefResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
