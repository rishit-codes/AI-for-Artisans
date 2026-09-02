import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import mapped_column, Mapped
from app.db.base import Base


class EmailOutbox(Base):
    """Sandbox mail transport — no real SMTP/email-provider credentials exist
    for this app, so 'sending' an email writes it here instead of over the
    wire. Lets verification/reset flows be exercised and inspected end-to-end
    (GET /admin/email-outbox) without a real mail service."""
    __tablename__ = "email_outbox"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    to_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=sa.func.now())
