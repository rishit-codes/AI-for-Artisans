from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.endpoints.advisor import get_advisor_feed

router = APIRouter()

@router.get("/timeline")
async def get_timeline(db: AsyncSession = Depends(get_db)):
    """Production advisor timeline — now dynamically queries LLM via real time weather & festivals."""
    feed = await get_advisor_feed(artisan_id=None, db=db)
    return feed
