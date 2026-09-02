import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.email_outbox import EmailOutbox

logger = logging.getLogger(__name__)


async def send_email(db: AsyncSession, to_email: str, subject: str, body_text: str) -> None:
    """Sandbox mail transport — see EmailOutbox for why. Writes the message
    to the outbox table (inspectable via GET /admin/email-outbox) instead of
    delivering it over real SMTP."""
    db.add(EmailOutbox(to_email=to_email, subject=subject, body_text=body_text))
    await db.commit()
    logger.info(f"[sandbox email] to={to_email} subject={subject!r}")
