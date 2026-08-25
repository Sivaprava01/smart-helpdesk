"""Central declarative base, models, and metadata registry for Alembic and application code."""

from smart_helpdesk.db.enums import AssignmentStatus, TicketStatus, UserRole
from smart_helpdesk.db.models.base import Base, BaseModel, TimestampMixin, UUIDMixin
from smart_helpdesk.db.models.customer import Customer
from smart_helpdesk.db.models.customer_technician_history import (
    CustomerTechnicianHistory,
)
from smart_helpdesk.db.models.service_category import (
    ServiceCategory,
    technician_service_categories,
)
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
from smart_helpdesk.db.models.ticket import Ticket
from smart_helpdesk.db.models.ticket_feedback import TicketFeedback
from smart_helpdesk.db.models.user import User

__all__ = [
    "AssignmentStatus",
    "Base",
    "BaseModel",
    "Customer",
    "CustomerTechnicianHistory",
    "ServiceCategory",
    "Technician",
    "TechnicianAssignment",
    "Ticket",
    "TicketFeedback",
    "TicketStatus",
    "TimestampMixin",
    "UUIDMixin",
    "User",
    "UserRole",
    "technician_service_categories",
]
