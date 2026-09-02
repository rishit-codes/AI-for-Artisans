"""add plan_items table for the advisor production plan

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-09-02 03:30:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "plan_items",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("product_id", sa.Uuid(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("week", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_plan_items_user", "plan_items", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_plan_items_user", table_name="plan_items")
    op.drop_table("plan_items")
