from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field

from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.schemas.assignment import FallbackSummary


class CustomerResponseRequest(BaseModel):
    """Payload for customer resolution decision and feedback."""

    was_issue_resolved: bool = Field(
        ...,
        description="Whether the customer's issue was actually resolved",
    )
    rating: int | None = Field(
        None,
        ge=1,
        le=5,
        description="Optional customer rating from 1 to 5",
    )
    comment: str | None = Field(
        None,
        max_length=1000,
        description="Optional feedback comment",
    )


class TicketFeedbackResponse(BaseModel):
    """Schema representing a submitted feedback record."""

    id: uuid.UUID
    ticket_id: uuid.UUID
    assignment_id: uuid.UUID
    customer_id: uuid.UUID
    technician_id: uuid.UUID
    was_issue_resolved: bool
    rating: int | None = None
    comment: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResolutionResponse(BaseModel):
    """Response returned when customer submits resolution confirmation/feedback."""

    ticket_id: uuid.UUID
    ticket_status: TicketStatus
    feedback: TicketFeedbackResponse
    fallback: FallbackSummary | None = None
