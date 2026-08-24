from datetime import datetime
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.models.base import BaseModel

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer import Customer
    from smart_helpdesk.db.models.technician import Technician


class CustomerTechnicianHistory(BaseModel):
    """Aggregated historical interaction and performance metrics between a specific customer and technician."""

    __tablename__ = "customer_technician_history"
    __table_args__ = (
        UniqueConstraint(
            "customer_id",
            "technician_id",
            name="uq_customer_technician_pair",
        ),
        CheckConstraint(
            "positive_interactions >= 0",
            name="ck_history_positive_interactions_non_negative",
        ),
        CheckConstraint(
            "negative_interactions >= 0",
            name="ck_history_negative_interactions_non_negative",
        ),
        CheckConstraint(
            "successful_jobs_count >= 0",
            name="ck_history_successful_jobs_non_negative",
        ),
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
    positive_interactions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    negative_interactions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    successful_jobs_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    last_interaction_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="technician_histories",
    )
    technician: Mapped["Technician"] = relationship(
        "Technician",
        back_populates="customer_histories",
    )
