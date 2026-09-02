"""add buyer_id to orders for real marketplace checkout

Revision ID: g7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-09-02 09:45:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "g7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.add_column(sa.Column("buyer_id", sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            "fk_orders_buyer_id_users", "users", ["buyer_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_index("ix_orders_buyer_id", ["buyer_id"])


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.drop_index("ix_orders_buyer_id")
        batch_op.drop_constraint("fk_orders_buyer_id_users", type_="foreignkey")
        batch_op.drop_column("buyer_id")
