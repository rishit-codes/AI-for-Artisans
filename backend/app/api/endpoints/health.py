from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["monitor"])
async def health_check():
    """Simple health check endpoint.
    Returns status and environment. Used for keep‑alive pings.
    """
    return {"status": "ok", "environment": settings.ENVIRONMENT}
