from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, CheckConstraint, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.models.base import BaseModel
from smart_helpdesk.db.models.service_category import technician_service_categories

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer_technician_history import (
        CustomerTechnicianHistory,
    )
    from smart_helpdesk.db.models.service_category import ServiceCategory
    from smart_helpdesk.db.models.technician_assignment import (
        TechnicianAssignment,
    )


class Technician(BaseModel):
    """Represents a service technician capable of fulfilling tickets."""

    __tablename__ = "technicians"
    __table_args__ = (
        CheckConstraint(
            "current_workload >= 0",
            name="ck_technicians_current_workload_non_negative",
        ),
        CheckConstraint(
            "max_workload >= 0",
            name="ck_technicians_max_workload_non_negative",
        ),
        CheckConstraint(
            "overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5)",
            name="ck_technicians_rating_range",
        ),
        CheckConstraint(
            "completed_jobs_count >= 0",
            name="ck_technicians_completed_jobs_non_negative",
        ),
        CheckConstraint(
            "reopened_jobs_count >= 0",
            name="ck_technicians_reopened_jobs_non_negative",
        ),
    )

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
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_on_duty: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    current_workload: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    max_workload: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )
    overall_rating: Mapped[Decimal | None] = mapped_column(
        Numeric(precision=3, scale=2),
        nullable=True,
        default=None,
    )
    completed_jobs_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    reopened_jobs_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    categories: Mapped[list["ServiceCategory"]] = relationship(
        "ServiceCategory",
        secondary=technician_service_categories,
        back_populates="technicians",
    )
    assignments: Mapped[list["TechnicianAssignment"]] = relationship(
        "TechnicianAssignment",
        back_populates="technician",
    )
    customer_histories: Mapped[list["CustomerTechnicianHistory"]] = relationship(
        "CustomerTechnicianHistory",
        back_populates="technician",
    )
