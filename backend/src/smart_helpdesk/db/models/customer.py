from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.models.base import BaseModel

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer_technician_history import (
        CustomerTechnicianHistory,
    )
    from smart_helpdesk.db.models.ticket import Ticket
    from smart_helpdesk.db.models.ticket_feedback import TicketFeedback


class Customer(BaseModel):
    """Represents a resident or customer requesting services."""

    __tablename__ = "customers"

    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    phone_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    age: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    default_location: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    tickets: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    technician_histories: Mapped[list["CustomerTechnicianHistory"]] = relationship(
        "CustomerTechnicianHistory",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    feedbacks: Mapped[list["TicketFeedback"]] = relationship(
        "TicketFeedback",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
