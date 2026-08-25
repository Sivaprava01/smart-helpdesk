import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from smart_helpdesk.db.enums import UserRole
from smart_helpdesk.db.models.base import BaseModel

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer import Customer
    from smart_helpdesk.db.models.technician import Technician


class User(BaseModel):
    """User account model for authentication, role-based authorization, and OAuth."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="userrole"),
        nullable=False,
        default=UserRole.CUSTOMER,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    oauth_provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    oauth_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Clean domain linkages
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    technician_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("technicians.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    customer: Mapped["Customer | None"] = relationship("Customer")
    technician: Mapped["Technician | None"] = relationship("Technician")

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"
