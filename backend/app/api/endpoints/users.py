from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.crud.user import update

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    return current_user

@router.put("/me", response_model=UserRead)
async def update_user_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    updated_user = await update(db, db_obj=current_user, obj_in=data)
    return updated_user
