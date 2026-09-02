"""add tasks table for dashboard 'Add to today' / 'Snooze'

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-02 03:00:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("snoozed_until", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tasks_user_status", "tasks", ["user_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_tasks_user_status", table_name="tasks")
    op.drop_table("tasks")
