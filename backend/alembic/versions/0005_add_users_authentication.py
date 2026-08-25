"""Add user authentication and role-based authorization table.

Revision ID: 0005_add_users_authentication
Revises: 0004_add_service_execution_and_feedback
Create Date: 2026-08-25 19:45:00.000000

"""

from typing import Sequence, Union
import alembic.op as op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_add_users_authentication"
down_revision: Union[str, None] = "0004_add_service_execution_and_feedback"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create UserRole ENUM type
    user_role_enum = postgresql.ENUM(
        "ADMIN",
        "DISPATCHER",
        "TECHNICIAN",
        "CUSTOMER",
        name="userrole",
        create_type=False,
    )
    user_role_enum.create(op.get_bind(), checkfirst=True)

    # 2. Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("role", postgresql.ENUM("ADMIN", "DISPATCHER", "TECHNICIAN", "CUSTOMER", name="userrole", create_type=False), server_default="CUSTOMER", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("oauth_provider", sa.String(length=50), nullable=True),
        sa.Column("oauth_id", sa.String(length=255), nullable=True),
        sa.Column("customer_id", sa.UUID(), nullable=True),
        sa.Column("technician_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)
    op.create_index(op.f("ix_users_customer_id"), "users", ["customer_id"], unique=False)
    op.create_index(op.f("ix_users_technician_id"), "users", ["technician_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_technician_id"), table_name="users")
    op.drop_index(op.f("ix_users_customer_id"), table_name="users")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
