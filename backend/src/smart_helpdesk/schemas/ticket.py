from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator

from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.schemas.customer import CustomerBriefResponse
from smart_helpdesk.schemas.service_category import ServiceCategoryBriefResponse


class TicketCreate(BaseModel):
    """Schema for creating a service ticket (ASAP or scheduled)."""

    customer_id: uuid.UUID = Field(..., description="UUID of the customer account raising the ticket")
    contact_name: str = Field(..., min_length=1, max_length=255, description="Contact person for this service request")
    contact_phone: str = Field(..., min_length=5, max_length=50, description="Contact phone for this service request")
    description: str = Field(..., min_length=5, max_length=5000, description="Detailed problem description")
    category_id: uuid.UUID = Field(..., description="UUID of the requested service category")
    location: str = Field(..., min_length=1, max_length=500, description="Service address/apartment location")
    preferred_time: datetime | None = Field(None, description="Optional customer preferred time window")
    is_scheduled: bool = Field(False, description="True if ticket is scheduled for a specific future datetime")
    scheduled_for: datetime | None = Field(None, description="Required future datetime when is_scheduled is True")

    @model_validator(mode="after")
    def validate_scheduling(self) -> "TicketCreate":
        now = datetime.now(timezone.utc)
        if self.is_scheduled:
            if self.scheduled_for is None:
                raise ValueError("scheduled_for must be provided when is_scheduled is True")
            # Normalize naive datetimes to UTC if needed
            scheduled_time = (
                self.scheduled_for
                if self.scheduled_for.tzinfo is not None
                else self.scheduled_for.replace(tzinfo=timezone.utc)
            )
            if scheduled_time <= now:
                raise ValueError("scheduled_for must be a datetime in the future")
        else:
            if self.scheduled_for is not None:
                raise ValueError("scheduled_for must be null when is_scheduled is False (ASAP request)")
        return self


class TicketUpdate(BaseModel):
    """Schema for controlled partial updates to ticket details before assignment."""

    contact_name: str | None = Field(None, min_length=1, max_length=255)
    contact_phone: str | None = Field(None, min_length=5, max_length=50)
    description: str | None = Field(None, min_length=5, max_length=5000)
    category_id: uuid.UUID | None = None
    location: str | None = Field(None, min_length=1, max_length=500)
    preferred_time: datetime | None = None
    is_scheduled: bool | None = None
    scheduled_for: datetime | None = None

    @model_validator(mode="after")
    def validate_scheduling_update(self) -> "TicketUpdate":
        now = datetime.now(timezone.utc)
        if self.is_scheduled is True:
            if self.scheduled_for is None:
                raise ValueError("scheduled_for must be provided when updating is_scheduled to True")
            scheduled_time = (
                self.scheduled_for
                if self.scheduled_for.tzinfo is not None
                else self.scheduled_for.replace(tzinfo=timezone.utc)
            )
            if scheduled_time <= now:
                raise ValueError("scheduled_for must be a datetime in the future")
        elif self.is_scheduled is False:
            if self.scheduled_for is not None:
                raise ValueError("scheduled_for must be null when is_scheduled is set to False")
        return self


class TicketResponse(BaseModel):
    """Schema for returning complete ticket details."""

    id: uuid.UUID
    customer_id: uuid.UUID
    contact_name: str
    contact_phone: str
    description: str
    category_id: uuid.UUID
    location: str
    preferred_time: datetime | None
    status: TicketStatus
    is_scheduled: bool
    scheduled_for: datetime | None
    created_at: datetime
    updated_at: datetime

    category: ServiceCategoryBriefResponse | None = None
    customer: CustomerBriefResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class TicketStatusResponse(BaseModel):
    """Schema for lightweight ticket status polling."""

    ticket_id: uuid.UUID
    status: TicketStatus
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
