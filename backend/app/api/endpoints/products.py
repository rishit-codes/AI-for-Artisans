import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.crud.product import get_all_by_artisan, create, update, delete
from sqlalchemy import select
from app.core.exceptions import ArtisanForbiddenError, ArtisanNotFoundError

router = APIRouter()

async def get_product_or_404(db: AsyncSession, product_id: uuid.UUID) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        # Prompt requires 404 for not found but 403 for ownership check.
        # But to avoid enumeration, 403 should be used for both if we want to be safe, 
        # however prompt says "Return 404 if product not found, Return 403 if product belongs to a different artisan (never 404 — no enumeration)".
        # Wait, if we return 404 if product not found, but 403 if it belongs to someone else, that IS enumeration.
        # Rereading prompt: "Return 403 if product belongs to a different artisan (never 404 — no enumeration)".
        # Wait, that means if product doesn't exist, we probably shouldn't tell them it doesn't exist unless they own it? 
        # I'll stick to: 404 if not found in db. 403 if found but wrong owner.
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("", response_model=List[ProductRead])
async def read_products(
    listed_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    products = await get_all_by_artisan(db, artisan_id=current_user.id, listed_only=listed_only)
    return products

@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    new_product = await create(db, obj_in=data, artisan_id=current_user.id)
    return new_product

@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    product = await get_product_or_404(db, product_id)
    if product.artisan_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized to edit this product")
    
    updated_product = await update(db, db_obj=product, obj_in=data)
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    product = await get_product_or_404(db, product_id)
    if product.artisan_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized to delete this product")
    
    await delete(db, db_obj=product)
