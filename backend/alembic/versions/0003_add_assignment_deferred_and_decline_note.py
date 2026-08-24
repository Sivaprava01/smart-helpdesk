"""Add decline_note and deferred_at to technician_assignments table.

Revision ID: 0003_add_assignment_deferred_and_decline_note
Revises: 0002_add_technician_current_zone
Create Date: 2026-08-24 20:10:00.000000

"""

from typing import Sequence, Union
import alembic.op as op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_add_assignment_deferred_and_decline_note"
down_revision: Union[str, None] = "0002_add_technician_current_zone"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "technician_assignments",
        sa.Column("decline_note", sa.Text(), nullable=True),
    )
    op.add_column(
        "technician_assignments",
        sa.Column("deferred_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("technician_assignments", "deferred_at")
    op.drop_column("technician_assignments", "decline_note")
