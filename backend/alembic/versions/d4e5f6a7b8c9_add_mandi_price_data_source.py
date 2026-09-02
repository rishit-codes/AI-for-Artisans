"""add mandi_prices.data_source (live vs estimated, honestly disclosed)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-02 04:00:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "mandi_prices",
        sa.Column("data_source", sa.String(20), nullable=False, server_default=sa.text("'estimated'")),
    )


def downgrade() -> None:
    op.drop_column("mandi_prices", "data_source")
