from typing import TYPE_CHECKING
import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.models.base import BaseModel

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer import Customer
    from smart_helpdesk.db.models.technician import Technician
    from smart_helpdesk.db.models.technician_assignment import TechnicianAssignment
    from smart_helpdesk.db.models.ticket import Ticket


class TicketFeedback(BaseModel):
    """Represents a customer's resolution confirmation and feedback for a completed service attempt."""

    __tablename__ = "ticket_feedbacks"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            name="uq_assignment_feedback",
        ),
        CheckConstraint(
            "rating IS NULL OR (rating >= 1 AND rating <= 5)",
            name="ck_feedback_rating_range",
        ),
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tickets.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("technician_assignments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    technician_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("technicians.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    was_issue_resolved: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )
    rating: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        default=None,
    )
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default=None,
    )

    # Relationships
    ticket: Mapped["Ticket"] = relationship(
        "Ticket",
        back_populates="feedbacks",
    )
    assignment: Mapped["TechnicianAssignment"] = relationship(
        "TechnicianAssignment",
        back_populates="feedbacks",
    )
    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="feedbacks",
    )
    technician: Mapped["Technician"] = relationship(
        "Technician",
        back_populates="feedbacks",
    )
