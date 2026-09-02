import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base


class AdminAuditLog(Base):
    """Immutable record of every admin mutation on a user — role changes,
    suspensions, GI-certification decisions. Never updated after creation."""
    __tablename__ = "admin_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False)
    target_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_email: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())

    __table_args__ = (
        sa.Index("ix_admin_audit_logs_target", "target_user_id"),
    )
