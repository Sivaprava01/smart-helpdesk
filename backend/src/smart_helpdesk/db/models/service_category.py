from typing import TYPE_CHECKING
import uuid
from sqlalchemy import Boolean, Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.models.base import Base, BaseModel

if TYPE_CHECKING:
    from smart_helpdesk.db.models.technician import Technician
    from smart_helpdesk.db.models.ticket import Ticket

# Association table for Technician <-> ServiceCategory many-to-many relationship
technician_service_categories = Table(
    "technician_service_categories",
    Base.metadata,
    Column(
        "technician_id",
        ForeignKey("technicians.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "category_id",
        ForeignKey("service_categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class ServiceCategory(BaseModel):
    """Represents a category of service (e.g., Plumbing, Electrical, HVAC)."""

    __tablename__ = "service_categories"

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Many-to-many relationship with Technician
    technicians: Mapped[list["Technician"]] = relationship(
        "Technician",
        secondary=technician_service_categories,
        back_populates="categories",
    )

    # One-to-many relationship with Ticket
    tickets: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        back_populates="category",
    )
