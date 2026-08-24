"""Add current_zone to technicians table.

Revision ID: 0002_add_technician_current_zone
Revises: 0001_initial_phase2_schema
Create Date: 2026-08-24 19:45:00.000000

"""

from typing import Sequence, Union
import alembic.op as op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_add_technician_current_zone"
down_revision: Union[str, None] = "0001_initial_phase2_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "technicians",
        sa.Column("current_zone", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("technicians", "current_zone")
