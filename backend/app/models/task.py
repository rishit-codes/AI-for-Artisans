import uuid
from datetime import datetime, date
import sqlalchemy as sa
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, text
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base


class Task(Base):
    """A user-created to-do, e.g. from 'Add to today' / 'Snooze' on a
    dashboard priority recommendation. Status: pending, done, snoozed."""
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20), server_default=text("'pending'"), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    snoozed_until: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    __table_args__ = (
        sa.Index("ix_tasks_user_status", "user_id", "status"),
    )
