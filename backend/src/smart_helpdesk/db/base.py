"""Central declarative base and metadata registry."""

from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.base import Base, BaseModel, TimestampMixin, UUIDMixin

__all__ = [
    "AssignmentStatus",
    "Base",
    "BaseModel",
    "TicketStatus",
    "TimestampMixin",
    "UUIDMixin",
]
