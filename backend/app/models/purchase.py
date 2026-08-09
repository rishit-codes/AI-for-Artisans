import uuid
from datetime import datetime, date
import sqlalchemy as sa
from sqlalchemy import String, Numeric, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base

class Purchase(Base):
    """A logged raw-material purchase, used to compute GST input tax credit."""
    __tablename__ = "purchases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    artisan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    gst_rate: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    __table_args__ = (
        sa.Index("ix_purchases_artisan_date", "artisan_id", "purchase_date"),
    )
