from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field

from smart_helpdesk.db.enums import AssignmentStatus, DeclineReason
from smart_helpdesk.schemas.technician import TechnicianResponse


class DeclineRequest(BaseModel):
    """Payload for declining a technician assignment offer."""

    reason: DeclineReason | None = Field(None, description="Standardized reason for declining the offer")
    note: str | None = Field(None, max_length=500, description="Optional brief explanation note")


class AssignmentResponse(BaseModel):
    """Schema representing a technician assignment record."""

    id: uuid.UUID
    ticket_id: uuid.UUID
    technician_id: uuid.UUID
    status: AssignmentStatus
    assigned_at: datetime
    responded_at: datetime | None = None
    accepted_at: datetime | None = None
    declined_at: datetime | None = None
    deferred_at: datetime | None = None
    decline_reason: str | None = None
    decline_note: str | None = None
    expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FallbackSummary(BaseModel):
    """Summary of fallback rerouting outcome."""

    status: str = Field(..., description="NEW_TECHNICIAN_OFFERED | NO_ELIGIBLE_TECHNICIAN_AVAILABLE")
    assignment_id: uuid.UUID | None = None
    technician_id: uuid.UUID | None = None
    technician_name: str | None = None
    response_deadline: datetime | None = None


class AssignmentActionResponse(BaseModel):
    """Response returned when an assignment action (accept, decline, defer) is processed."""

    ticket_id: uuid.UUID
    assignment: AssignmentResponse
    fallback: FallbackSummary | None = None


class ExpiredProcessingResponse(BaseModel):
    """Summary of batch expired assignment processing."""

    expired_count: int
    rerouted_count: int
    unassigned_count: int
    details: list[dict[str, object]] = []
