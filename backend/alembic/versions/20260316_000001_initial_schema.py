"""initial schema

Revision ID: 20260316_000001
Revises:
Create Date: 2026-03-16 11:20:00
"""

# pyright: reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false, reportUnknownParameterType=false, reportUnknownLambdaType=false

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260316_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if not is_sqlite:
        op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        op.execute(
            """
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
            """
        )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()") if not is_sqlite else None),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.Text(), nullable=False),
        sa.Column("craft_type", sa.String(length=100), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE") if not is_sqlite else sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()") if not is_sqlite else sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()") if not is_sqlite else sa.func.now()),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()") if not is_sqlite else None),
        sa.Column("artisan_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("material", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("stock_qty", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_listed", sa.Boolean(), nullable=False, server_default=sa.text("TRUE") if not is_sqlite else sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()") if not is_sqlite else sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()") if not is_sqlite else sa.func.now()),
    )
    op.create_index("ix_products_artisan_id", "products", ["artisan_id"])

    if not is_sqlite:
        op.execute(
            """
            CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            """
        )
        op.execute(
            """
            CREATE TRIGGER update_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            """
        )

    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=sa.text("gen_random_uuid()") if not is_sqlite else None),
        sa.Column("artisan_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Uuid(), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00")),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'INR'")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()") if not is_sqlite else sa.func.now()),
    )
    op.create_index("ix_orders_artisan_id", "orders", ["artisan_id"])
    op.create_index("ix_orders_product_id", "orders", ["product_id"])


def downgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if not is_sqlite:
        op.execute("DROP TRIGGER IF EXISTS update_products_updated_at ON products")
        op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users")

    op.drop_index("ix_orders_product_id", table_name="orders")
    op.drop_index("ix_orders_artisan_id", table_name="orders")
    op.drop_table("orders")

    op.drop_index("ix_products_artisan_id", table_name="products")
    op.drop_table("products")

    op.drop_table("users")
    
    if not is_sqlite:
        op.execute("DROP FUNCTION IF EXISTS update_updated_at_column")
