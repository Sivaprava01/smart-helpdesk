from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field

from smart_helpdesk.db.enums import TicketStatus


class CompleteWorkRequest(BaseModel):
    """Payload for technician marking service work completed."""

    note: str | None = Field(None, max_length=1000, description="Optional technician work summary note")


class ExecutionActionResponse(BaseModel):
    """Response returned when an execution step (arrive, start-work, complete-work) succeeds."""

    ticket_id: uuid.UUID
    status: TicketStatus
    assignment_id: uuid.UUID
    technician_id: uuid.UUID
    arrived_at: datetime | None = None
    work_started_at: datetime | None = None
    work_completed_at: datetime | None = None
    completion_note: str | None = None

    model_config = ConfigDict(from_attributes=True)
