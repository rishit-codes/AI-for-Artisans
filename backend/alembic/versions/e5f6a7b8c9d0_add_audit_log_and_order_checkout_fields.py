"""add admin_audit_logs table and order checkout/shipping/payment fields

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-09-02 05:00:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("admin_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("admin_email", sa.String(255), nullable=False),
        sa.Column("target_user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("target_email", sa.String(255), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_admin_audit_logs_target", "admin_audit_logs", ["target_user_id"])

    with op.batch_alter_table("orders") as batch_op:
        batch_op.add_column(sa.Column("buyer_name", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("buyer_email", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("buyer_phone", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("shipping_address", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("shipping_city", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("shipping_state", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("shipping_pincode", sa.String(10), nullable=True))
        batch_op.add_column(sa.Column("carrier", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("tracking_number", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("shipped_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("payment_status", sa.String(20), nullable=False, server_default=sa.text("'pending'")))
        batch_op.add_column(sa.Column("payment_ref", sa.String(100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.drop_column("payment_ref")
        batch_op.drop_column("payment_status")
        batch_op.drop_column("delivered_at")
        batch_op.drop_column("shipped_at")
        batch_op.drop_column("tracking_number")
        batch_op.drop_column("carrier")
        batch_op.drop_column("shipping_pincode")
        batch_op.drop_column("shipping_state")
        batch_op.drop_column("shipping_city")
        batch_op.drop_column("shipping_address")
        batch_op.drop_column("buyer_phone")
        batch_op.drop_column("buyer_email")
        batch_op.drop_column("buyer_name")

    op.drop_index("ix_admin_audit_logs_target", table_name="admin_audit_logs")
    op.drop_table("admin_audit_logs")
