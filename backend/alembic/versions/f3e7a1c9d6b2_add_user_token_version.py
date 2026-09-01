"""add users.token_version for "sign out of all devices"

Revision ID: f3e7a1c9d6b2
Revises: c1a4f9e2b8d3
Create Date: 2026-09-02 00:15:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f3e7a1c9d6b2"
down_revision = "c1a4f9e2b8d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
