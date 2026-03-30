import uuid
from datetime import datetime, date
import sqlalchemy as sa
from sqlalchemy import String, Integer, Numeric, Text, Date, DateTime, ForeignKey, text
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_per_unit: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    channel: Mapped[str | None] = mapped_column(String(100))
    sale_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    __table_args__ = (
        sa.Index("ix_sales_user_date_product", "user_id", "sale_date", "product_id"),
    )
