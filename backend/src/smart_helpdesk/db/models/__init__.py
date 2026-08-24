"""Database models package."""

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

__all__ = [
    "Base",
    "BaseModel",
    "Customer",
    "CustomerTechnicianHistory",
    "ServiceCategory",
    "Technician",
    "TechnicianAssignment",
    "Ticket",
    "TicketFeedback",
    "TimestampMixin",
    "UUIDMixin",
    "technician_service_categories",
]
