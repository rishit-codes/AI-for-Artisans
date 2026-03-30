import uuid
from datetime import date, datetime
import sqlalchemy as sa
from sqlalchemy import String, Numeric, Date, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base

class MarketSignal(Base):
    __tablename__ = "market_signals"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    signal_type: Mapped[str] = mapped_column(String(50), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    __table_args__ = (
        UniqueConstraint("signal_type", "key", "recorded_at", name="uix_market_signals_type_key_date"),
        Index("ix_market_signals_type_key_date", "signal_type", "key", "recorded_at"),
    )
