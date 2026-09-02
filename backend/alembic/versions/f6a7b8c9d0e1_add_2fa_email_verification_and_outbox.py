"""add 2FA fields, email verification/reset tokens, and sandbox email outbox

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-09-02 06:00:00
"""

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")))
        batch_op.add_column(sa.Column("totp_secret", sa.String(64), nullable=True))
        batch_op.add_column(sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("0")))

    op.create_table(
        "email_tokens",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("token", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column("purpose", sa.String(30), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "email_outbox",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("to_email", sa.String(255), nullable=False, index=True),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("body_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("email_outbox")
    op.drop_table("email_tokens")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("totp_enabled")
        batch_op.drop_column("totp_secret")
        batch_op.drop_column("email_verified")
