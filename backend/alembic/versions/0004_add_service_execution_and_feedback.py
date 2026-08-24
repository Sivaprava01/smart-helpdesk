"""Add service execution timestamps, technician rating aggregates, and ticket_feedbacks table.

Revision ID: 0004_add_service_execution_and_feedback
Revises: 0003_add_assignment_deferred_and_decline_note
Create Date: 2026-08-24 20:35:00.000000

"""

from typing import Sequence, Union
import alembic.op as op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_add_service_execution_and_feedback"
down_revision: Union[str, None] = "0003_add_assignment_deferred_and_decline_note"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update technicians table with rating_sum and rating_count
    op.add_column(
        "technicians",
        sa.Column("rating_sum", sa.Numeric(precision=10, scale=2), server_default="0.00", nullable=False),
    )
    op.add_column(
        "technicians",
        sa.Column("rating_count", sa.Integer(), server_default="0", nullable=False),
    )

    # 2. Update technician_assignments table with execution timestamps and completion_note
    op.add_column(
        "technician_assignments",
        sa.Column("arrived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "technician_assignments",
        sa.Column("work_started_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "technician_assignments",
        sa.Column("work_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "technician_assignments",
        sa.Column("completion_note", sa.Text(), nullable=True),
    )

    # 3. Create ticket_feedbacks table
    op.create_table(
        "ticket_feedbacks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("ticket_id", sa.Uuid(), nullable=False),
        sa.Column("assignment_id", sa.Uuid(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("technician_id", sa.Uuid(), nullable=False),
        sa.Column("was_issue_resolved", sa.Boolean(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["technician_assignments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["technician_id"], ["technicians.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assignment_id", name="uq_assignment_feedback"),
        sa.CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="ck_feedback_rating_range"),
    )
    op.create_index(op.f("ix_ticket_feedbacks_assignment_id"), "ticket_feedbacks", ["assignment_id"], unique=False)
    op.create_index(op.f("ix_ticket_feedbacks_customer_id"), "ticket_feedbacks", ["customer_id"], unique=False)
    op.create_index(op.f("ix_ticket_feedbacks_technician_id"), "ticket_feedbacks", ["technician_id"], unique=False)
    op.create_index(op.f("ix_ticket_feedbacks_ticket_id"), "ticket_feedbacks", ["ticket_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ticket_feedbacks_ticket_id"), table_name="ticket_feedbacks")
    op.drop_index(op.f("ix_ticket_feedbacks_technician_id"), table_name="ticket_feedbacks")
    op.drop_index(op.f("ix_ticket_feedbacks_customer_id"), table_name="ticket_feedbacks")
    op.drop_index(op.f("ix_ticket_feedbacks_assignment_id"), table_name="ticket_feedbacks")
    op.drop_table("ticket_feedbacks")

    op.drop_column("technician_assignments", "completion_note")
    op.drop_column("technician_assignments", "work_completed_at")
    op.drop_column("technician_assignments", "work_started_at")
    op.drop_column("technician_assignments", "arrived_at")

    op.drop_column("technicians", "rating_count")
    op.drop_column("technicians", "rating_sum")
