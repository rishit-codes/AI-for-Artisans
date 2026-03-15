import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

async def get_all_by_artisan(
    db: AsyncSession, artisan_id: uuid.UUID, listed_only: bool = False
) -> List[Product]:
    stmt = select(Product).where(Product.artisan_id == artisan_id)
    if listed_only:
        stmt = stmt.where(Product.is_listed == True)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def create(db: AsyncSession, obj_in: ProductCreate, artisan_id: uuid.UUID) -> Product:
    db_obj = Product(
        **obj_in.model_dump(),
        artisan_id=artisan_id
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update(db: AsyncSession, db_obj: Product, obj_in: ProductUpdate) -> Product:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete(db: AsyncSession, db_obj: Product) -> None:
    await db.delete(db_obj)
    await db.commit()
