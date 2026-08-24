from datetime import datetime
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.enums import TicketStatus
from smart_helpdesk.db.models.base import BaseModel

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer import Customer
    from smart_helpdesk.db.models.service_category import ServiceCategory
    from smart_helpdesk.db.models.technician_assignment import (
        TechnicianAssignment,
    )
    from smart_helpdesk.db.models.ticket_feedback import TicketFeedback


class Ticket(BaseModel):
    """Represents a customer maintenance or service request."""

    __tablename__ = "tickets"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    contact_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    contact_phone: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("service_categories.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    location: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    preferred_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, native_enum=False, length=50),
        default=TicketStatus.PENDING,
        index=True,
        nullable=False,
    )
    is_scheduled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    scheduled_for: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="tickets",
    )
    category: Mapped["ServiceCategory"] = relationship(
        "ServiceCategory",
        back_populates="tickets",
    )
    assignments: Mapped[list["TechnicianAssignment"]] = relationship(
        "TechnicianAssignment",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )
    feedbacks: Mapped[list["TicketFeedback"]] = relationship(
        "TicketFeedback",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )
