from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import uuid

from app.db.session import get_db
from app.core.config import settings
from app.core.exceptions import InvalidCredentialsError, ArtisanNotFoundError, ArtisanForbiddenError
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        raise InvalidCredentialsError()

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise InvalidCredentialsError()
        user_id = uuid.UUID(user_id_str)
        token_version = payload.get("tv", 0)
    except JWTError:
        raise InvalidCredentialsError()
    except ValueError:
        raise InvalidCredentialsError()

    # Fetch user by UUID
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise InvalidCredentialsError()

    if not user.is_active:
        raise ArtisanForbiddenError(detail="This account has been suspended. Contact support.")

    # A stale token_version means this token was issued before the user last hit
    # "sign out of all devices" — reject it even though the JWT signature itself
    # is still valid and unexpired.
    if token_version != user.token_version:
        raise InvalidCredentialsError(detail="Session has been signed out. Please log in again.")

    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Gate for /admin/* routes — a valid, logged-in user is not enough."""
    if current_user.role != "admin":
        raise ArtisanForbiddenError(detail="Admin access required")
    return current_user
