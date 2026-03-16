from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
import uuid

from app.db.session import get_db
from app.core.config import settings
from app.core.exceptions import InvalidCredentialsError, ArtisanNotFoundError
from app.crud.user import get_by_email
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise InvalidCredentialsError()
        user_id = uuid.UUID(user_id_str)
    except JWTError:
        raise InvalidCredentialsError()
    except ValueError:
        raise InvalidCredentialsError()
    
    # We don't have get_by_id in crud yet, we could use email or id. Let's do get_by_id logic here natively or append it.
    from sqlalchemy import select
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise ArtisanNotFoundError()
    
    return user
