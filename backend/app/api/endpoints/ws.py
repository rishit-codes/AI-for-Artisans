import logging
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import jwt, JWTError
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.services.ws_manager import manager

router = APIRouter()
logger = logging.getLogger(__name__)


async def _authenticate(token: str | None) -> User | None:
    """Mirrors app.api.dependencies.get_current_user's checks, adapted for a
    WebSocket handshake — browsers can't attach an Authorization header to a
    WS upgrade request, so the JWT travels as a query param instead."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = uuid.UUID(payload.get("sub"))
        token_version = payload.get("tv", 0)
    except (JWTError, ValueError, TypeError):
        return None

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active or token_version != user.token_version:
            return None
        return user


@router.websocket("/notifications")
async def notifications_ws(websocket: WebSocket, token: str | None = None):
    user = await _authenticate(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user.id, websocket)
    logger.info("ws connect user=%s", user.id)
    try:
        while True:
            # This channel is push-only — the client never sends anything
            # meaningful, but we still need to await something so the
            # handler notices a disconnect instead of leaking the socket.
            await websocket.receive_text()
    except WebSocketDisconnect as e:
        logger.info("ws disconnect user=%s code=%s", user.id, e.code)
    finally:
        manager.disconnect(user.id, websocket)
