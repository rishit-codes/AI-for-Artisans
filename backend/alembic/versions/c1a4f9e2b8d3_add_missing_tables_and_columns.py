"""add missing tables (purchases, materials, mandi_scraping_logs, mandi_prices),
users.avatar_url, and sales.unit_cost

These tables and columns already existed as SQLAlchemy models and were being
created only via Base.metadata.create_all() on the dev SQLite database at
startup, which silently papered over the fact that no migration for them
existed — a fresh Postgres deploy managed purely by `alembic upgrade head`
would be missing all of this.

Revision ID: c1a4f9e2b8d3
Revises: 96b721eec1c9
Create Date: 2026-09-01 18:10:00
"""

# pyright: reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false, reportUnknownParameterType=false, reportUnknownLambdaType=false

from alembic import op  # pyright: ignore[reportAttributeAccessIssue]
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c1a4f9e2b8d3"
down_revision = "96b721eec1c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"
    uuid_default = None if is_sqlite else sa.text("gen_random_uuid()")
    now_default = sa.func.now() if is_sqlite else sa.text("now()")

    # -- users.avatar_url (model has it, initial migration never added it) --
    op.add_column("users", sa.Column("avatar_url", sa.String(length=500), nullable=True))

    # -- sales.unit_cost (new: lets an artisan optionally log per-unit cost
    #    so SaleResponse.profit can be a real number instead of == revenue) --
    op.add_column("sales", sa.Column("unit_cost", sa.Numeric(10, 2), nullable=True))

    # -- purchases --
    op.create_table(
        "purchases",
        sa.Column("id", sa.Uuid(), primary_key=True, server_default=uuid_default),
        sa.Column("artisan_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("material_name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("gst_rate", sa.Numeric(4, 2), nullable=False),
        sa.Column("purchase_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=now_default),
    )
    op.create_index("ix_purchases_artisan_date", "purchases", ["artisan_id", "purchase_date"])

    # -- materials --
    op.create_table(
        "materials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("price", sa.String(length=50), nullable=True),
        sa.Column("unit", sa.String(length=20), nullable=True),
        sa.Column("change_pct", sa.String(length=20), nullable=True),
        sa.Column("trend", sa.String(length=10), nullable=True),
        sa.Column("sparkline_points", sa.Text(), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("commodity_full_name", sa.String(length=200), nullable=True),
        sa.Column("sub_unit", sa.String(length=50), nullable=True),
        sa.Column("local_price", sa.String(length=50), nullable=True),
        sa.Column("local_best", sa.Integer(), nullable=True),
        sa.Column("surat_price", sa.String(length=50), nullable=True),
        sa.Column("surat_best", sa.Integer(), nullable=True),
        sa.Column("delhi_price", sa.String(length=50), nullable=True),
        sa.Column("delhi_best", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=True),
    )

    # -- mandi_scraping_logs --
    op.create_table(
        "mandi_scraping_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("log_id", sa.String(length=50), nullable=True),
        sa.Column("mandi_city", sa.String(length=50), nullable=False),
        sa.Column("commodity_name", sa.String(length=100), nullable=False),
        sa.Column("price_per_unit", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=20), nullable=True),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("response_time_ms", sa.Float(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_mandi_scraping_logs_log_id", "mandi_scraping_logs", ["log_id"])
    op.create_index("ix_mandi_scraping_logs_mandi_city", "mandi_scraping_logs", ["mandi_city"])
    op.create_index("ix_mandi_scraping_logs_commodity_name", "mandi_scraping_logs", ["commodity_name"])
    op.create_index("ix_mandi_scraping_logs_scraped_at", "mandi_scraping_logs", ["scraped_at"])

    # -- mandi_prices --
    op.create_table(
        "mandi_prices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("commodity_name", sa.String(length=100), nullable=False),
        sa.Column("hindi_name", sa.String(length=100), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("unit", sa.String(length=20), nullable=True),
        sa.Column("varanasi_price", sa.Float(), nullable=True),
        sa.Column("surat_price", sa.Float(), nullable=True),
        sa.Column("delhi_price", sa.Float(), nullable=True),
        sa.Column("jaipur_price", sa.Float(), nullable=True),
        sa.Column("mumbai_price", sa.Float(), nullable=True),
        sa.Column("delta_7d", sa.Float(), nullable=True),
        sa.Column("sparkline_points", sa.Text(), nullable=True),
        sa.Column("supply_status", sa.String(length=20), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_mandi_prices_commodity_name", "mandi_prices", ["commodity_name"])


def downgrade() -> None:
    op.drop_index("ix_mandi_prices_commodity_name", table_name="mandi_prices")
    op.drop_table("mandi_prices")

    op.drop_index("ix_mandi_scraping_logs_scraped_at", table_name="mandi_scraping_logs")
    op.drop_index("ix_mandi_scraping_logs_commodity_name", table_name="mandi_scraping_logs")
    op.drop_index("ix_mandi_scraping_logs_mandi_city", table_name="mandi_scraping_logs")
    op.drop_index("ix_mandi_scraping_logs_log_id", table_name="mandi_scraping_logs")
    op.drop_table("mandi_scraping_logs")

    op.drop_table("materials")

    op.drop_index("ix_purchases_artisan_date", table_name="purchases")
    op.drop_table("purchases")

    op.drop_column("sales", "unit_cost")
    op.drop_column("users", "avatar_url")
