"""Central declarative base, models, and metadata registry."""

from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus
from smart_helpdesk.db.models.base import Base, BaseModel, TimestampMixin, UUIDMixin
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.service_category import (
    ServiceCategory,
    technician_service_categories,
)
from smart_helpdesk.db.models.technician import Technician

__all__ = [
    "AssignmentStatus",
    "Base",
    "BaseModel",
    "Customer",
    "ServiceCategory",
    "Technician",
    "TicketStatus",
    "TimestampMixin",
    "UUIDMixin",
    "technician_service_categories",
]
