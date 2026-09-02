import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import Integer, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base


class PlanItem(Base):
    """One line in an artisan's production plan — 'add to plan' on an Advisor
    recommendation. Batched into a 4-week calendar by `week` (1-4)."""
    __tablename__ = "plan_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    week: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    __table_args__ = (
        sa.Index("ix_plan_items_user", "user_id"),
    )
