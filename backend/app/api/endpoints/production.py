from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.api.endpoints.advisor import get_advisor_feed
from app.models.user import User

router = APIRouter()

@router.get("/timeline")
async def get_timeline(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Production advisor timeline — now dynamically queries LLM via real time weather & festivals."""
    feed = await get_advisor_feed(request=request, artisan_id=str(current_user.id), current_user=current_user, db=db)
    return feed
