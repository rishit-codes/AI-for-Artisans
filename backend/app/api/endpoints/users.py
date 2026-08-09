import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import PublicKarigarProfile, UserRead, UserUpdate
from app.crud.user import update
from app.crud.product import get_all_by_artisan

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    return current_user

@router.get("/{user_id}/public", response_model=PublicKarigarProfile)
async def read_user_public(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Unauthenticated public Karigar identity card — safe subset of an
    artisan's profile plus their listed products, for /karigar/:id.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Artisan not found")

    bio_data: dict = {}
    if user.bio:
        try:
            bio_data = json.loads(user.bio)
        except (json.JSONDecodeError, TypeError):
            bio_data = {}

    products = await get_all_by_artisan(db, artisan_id=user.id, listed_only=True)

    return PublicKarigarProfile(
        id=user.id,
        full_name=user.full_name,
        craft_type=user.craft_type,
        location=user.location,
        craft_story=bio_data.get("craftStory"),
        gi_certified=bool(bio_data.get("giCertified", False)),
        gi_year=bio_data.get("giYear"),
        languages=bio_data.get("languages"),
        member_since=user.created_at.year,
        products=products,
    )

@router.put("/me", response_model=UserRead)
async def update_user_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    updated_user = await update(db, db_obj=current_user, obj_in=data)
    return updated_user
