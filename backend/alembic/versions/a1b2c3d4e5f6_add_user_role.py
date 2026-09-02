"""add users.role for the admin module

Revision ID: a1b2c3d4e5f6
Revises: f3e7a1c9d6b2
Create Date: 2026-09-02 02:00:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "f3e7a1c9d6b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(20), nullable=False, server_default=sa.text("'user'")),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
