"""orders safety and updated_at triggers

Revision ID: 20260316_000002
Revises: 20260316_000001
Create Date: 2026-03-16 12:10:00
"""

# pyright: reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false, reportUnknownParameterType=false, reportUnknownLambdaType=false

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260316_000002"
down_revision = "20260316_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if not is_sqlite:
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

        op.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_trigger
                    WHERE tgname = 'update_users_updated_at'
                ) THEN
                    CREATE TRIGGER update_users_updated_at
                    BEFORE UPDATE ON users
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                END IF;
            END
            $$;
            """
        )

        op.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_trigger
                    WHERE tgname = 'update_products_updated_at'
                ) THEN
                    CREATE TRIGGER update_products_updated_at
                    BEFORE UPDATE ON products
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
                END IF;
            END
            $$;
            """
        )

        op.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey")
        op.execute(
            """
            ALTER TABLE orders
            ADD CONSTRAINT orders_product_id_fkey
            FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE SET NULL
            """
        )

    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column("product_id", existing_type=sa.Uuid(), nullable=True)

    if not is_sqlite:
        op.execute(
            """
            UPDATE orders
            SET total_price = '0'
            WHERE total_price IS NULL OR btrim(total_price::text) = ''
            """
        )
        op.execute(
            """
            ALTER TABLE orders
            ALTER COLUMN total_price TYPE NUMERIC(10, 2)
            USING NULLIF(regexp_replace(total_price::text, '[^0-9\\.-]', '', 'g'), '')::NUMERIC
            """
        )
        op.execute("UPDATE orders SET total_price = 0.00 WHERE total_price IS NULL")
        
    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column("total_price", existing_type=sa.Numeric(10, 2), nullable=False, server_default=sa.text("0.00") if not is_sqlite else sa.text("0.0"))

    if not is_sqlite:
        op.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'currency'
                ) THEN
                    ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'INR';
                END IF;
            END
            $$;
            """
        )
        op.execute("UPDATE orders SET currency = 'INR' WHERE currency IS NULL")
    else:
        # SQLite: try adding column
        try:
            with op.batch_alter_table("orders") as batch_op:
                batch_op.add_column(sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'INR'")))
        except Exception:
            pass 

    with op.batch_alter_table("orders") as batch_op:
        batch_op.alter_column("currency", existing_type=sa.String(length=3), nullable=False, server_default=sa.text("'INR'"))


def downgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if not is_sqlite:
        op.execute("ALTER TABLE orders DROP COLUMN IF EXISTS currency")

        op.execute(
            """
            ALTER TABLE orders
            ALTER COLUMN total_price TYPE VARCHAR(50)
            USING ('₹' || total_price::text)
            """
        )
        op.alter_column("orders", "total_price", existing_type=sa.String(length=50), nullable=False, server_default=sa.text("'₹0'"))

        op.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey")
        op.execute(
            """
            ALTER TABLE orders
            ADD CONSTRAINT orders_product_id_fkey
            FOREIGN KEY (product_id)
            REFERENCES products(id)
            ON DELETE CASCADE
            """
        )

        op.execute("DROP TRIGGER IF EXISTS update_products_updated_at ON products")
        op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users")
        op.execute("DROP FUNCTION IF EXISTS update_updated_at_column")
    else:
        # SQLite downgrade logic if needed
        pass
