from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.purchase import PurchaseCreate, PurchaseRead
from app.crud.purchase import get_all_by_artisan, create

router = APIRouter()

@router.get("/history", response_model=List[PurchaseRead])
async def purchase_history(
    from_date: date = Query(None),
    to_date: date = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    return await get_all_by_artisan(db, artisan_id=current_user.id, from_date=from_date, to_date=to_date)

@router.post("/record", response_model=PurchaseRead, status_code=status.HTTP_201_CREATED)
async def record_purchase(
    data: PurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    return await create(db, obj_in=data, artisan_id=current_user.id)
