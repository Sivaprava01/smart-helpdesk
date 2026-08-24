"""Initial Phase 2 schema migration.

Revision ID: 0001_initial_phase2_schema
Revises:
Create Date: 2026-08-24 14:00:00.000000

"""

from typing import Sequence, Union
import alembic.op as op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial_phase2_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create service_categories table
    op.create_table(
        "service_categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_service_categories_name"), "service_categories", ["name"], unique=True)

    # 2. Create technicians table
    op.create_table(
        "technicians",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_on_duty", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("current_workload", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("max_workload", sa.Integer(), nullable=False, server_default=sa.text("5")),
        sa.Column("overall_rating", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("completed_jobs_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("reopened_jobs_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("current_workload >= 0", name="ck_technicians_current_workload_non_negative"),
        sa.CheckConstraint("max_workload >= 0", name="ck_technicians_max_workload_non_negative"),
        sa.CheckConstraint("overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5)", name="ck_technicians_rating_range"),
        sa.CheckConstraint("completed_jobs_count >= 0", name="ck_technicians_completed_jobs_non_negative"),
        sa.CheckConstraint("reopened_jobs_count >= 0", name="ck_technicians_reopened_jobs_non_negative"),
    )
    op.create_index(op.f("ix_technicians_email"), "technicians", ["email"], unique=True)
    op.create_index(op.f("ix_technicians_phone_number"), "technicians", ["phone_number"], unique=True)

    # 3. Create technician_service_categories association table
    op.create_table(
        "technician_service_categories",
        sa.Column("technician_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["service_categories.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("technician_id", "category_id"),
    )

    # 4. Create customers table
    op.create_table(
        "customers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone_number", sa.String(length=50), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("default_location", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_customers_email"), "customers", ["email"], unique=True)
    op.create_index(op.f("ix_customers_phone_number"), "customers", ["phone_number"], unique=True)

    # 5. Create tickets table
    op.create_table(
        "tickets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("contact_name", sa.String(length=255), nullable=False),
        sa.Column("contact_phone", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("location", sa.String(length=500), nullable=False),
        sa.Column("preferred_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "ROUTING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "AWAITING_CUSTOMER_CONFIRMATION", "CLOSED", "REOPENED", "CANCELLED", name="ticket_status_enum", native_enum=False, length=50), nullable=False, server_default="PENDING"),
        sa.Column("is_scheduled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["service_categories.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tickets_category_id"), "tickets", ["category_id"], unique=False)
    op.create_index(op.f("ix_tickets_customer_id"), "tickets", ["customer_id"], unique=False)
    op.create_index(op.f("ix_tickets_status"), "tickets", ["status"], unique=False)

    # 6. Create technician_assignments table
    op.create_table(
        "technician_assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("ticket_id", sa.Uuid(), nullable=False),
        sa.Column("technician_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.Enum("OFFERED", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED", "COMPLETED", name="assignment_status_enum", native_enum=False, length=50), nullable=False, server_default="OFFERED"),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("declined_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decline_reason", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_technician_assignments_status"), "technician_assignments", ["status"], unique=False)
    op.create_index(op.f("ix_technician_assignments_technician_id"), "technician_assignments", ["technician_id"], unique=False)
    op.create_index(op.f("ix_technician_assignments_ticket_id"), "technician_assignments", ["ticket_id"], unique=False)

    # 7. Create customer_technician_history table
    op.create_table(
        "customer_technician_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("technician_id", sa.Uuid(), nullable=False),
        sa.Column("positive_interactions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("negative_interactions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("successful_jobs_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_interaction_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_id", "technician_id", name="uq_customer_technician_pair"),
        sa.CheckConstraint("positive_interactions >= 0", name="ck_history_positive_interactions_non_negative"),
        sa.CheckConstraint("negative_interactions >= 0", name="ck_history_negative_interactions_non_negative"),
        sa.CheckConstraint("successful_jobs_count >= 0", name="ck_history_successful_jobs_non_negative"),
    )
    op.create_index(op.f("ix_customer_technician_history_customer_id"), "customer_technician_history", ["customer_id"], unique=False)
    op.create_index(op.f("ix_customer_technician_history_technician_id"), "customer_technician_history", ["technician_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_customer_technician_history_technician_id"), table_name="customer_technician_history")
    op.drop_index(op.f("ix_customer_technician_history_customer_id"), table_name="customer_technician_history")
    op.drop_table("customer_technician_history")

    op.drop_index(op.f("ix_technician_assignments_ticket_id"), table_name="technician_assignments")
    op.drop_index(op.f("ix_technician_assignments_technician_id"), table_name="technician_assignments")
    op.drop_index(op.f("ix_technician_assignments_status"), table_name="technician_assignments")
    op.drop_table("technician_assignments")

    op.drop_index(op.f("ix_tickets_status"), table_name="tickets")
    op.drop_index(op.f("ix_tickets_customer_id"), table_name="tickets")
    op.drop_index(op.f("ix_tickets_category_id"), table_name="tickets")
    op.drop_table("tickets")

    op.drop_index(op.f("ix_customers_phone_number"), table_name="customers")
    op.drop_index(op.f("ix_customers_email"), table_name="customers")
    op.drop_table("customers")

    op.drop_table("technician_service_categories")

    op.drop_index(op.f("ix_technicians_phone_number"), table_name="technicians")
    op.drop_index(op.f("ix_technicians_email"), table_name="technicians")
    op.drop_table("technicians")

    op.drop_index(op.f("ix_service_categories_name"), table_name="service_categories")
    op.drop_table("service_categories")
