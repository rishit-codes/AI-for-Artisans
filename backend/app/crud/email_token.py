import secrets
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_token import EmailToken

# Naive UTC throughout this module, deliberately: SQLite (this app's local/dev
# DB) doesn't preserve tzinfo on read even for DateTime(timezone=True) columns,
# so comparing a stored value against an aware datetime.now(timezone.utc) here
# would raise "can't compare offset-naive and offset-aware datetimes".


async def create_token(db: AsyncSession, user_id: uuid.UUID, purpose: str, hours_valid: int = 24) -> EmailToken:
    token = EmailToken(
        user_id=user_id,
        token=secrets.token_urlsafe(32),
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(hours=hours_valid),
    )
    db.add(token)
    await db.commit()
    await db.refresh(token)
    return token


async def consume_token(db: AsyncSession, token_str: str, purpose: str) -> EmailToken | None:
    """Returns the token row if valid and unused, marking it used. None otherwise."""
    result = await db.execute(select(EmailToken).where(EmailToken.token == token_str, EmailToken.purpose == purpose))
    token = result.scalar_one_or_none()
    if not token:
        return None
    if token.used_at is not None:
        return None
    if token.expires_at < datetime.utcnow():
        return None
    token.used_at = datetime.utcnow()
    db.add(token)
    await db.commit()
    return token
