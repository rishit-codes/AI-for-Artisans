import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate

async def get_all_by_artisan(
    db: AsyncSession,
    artisan_id: uuid.UUID,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> List[Purchase]:
    stmt = select(Purchase).where(Purchase.artisan_id == artisan_id)
    if from_date:
        stmt = stmt.where(Purchase.purchase_date >= from_date)
    if to_date:
        stmt = stmt.where(Purchase.purchase_date <= to_date)
    stmt = stmt.order_by(Purchase.purchase_date.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def create(db: AsyncSession, obj_in: PurchaseCreate, artisan_id: uuid.UUID) -> Purchase:
    db_obj = Purchase(**obj_in.model_dump(), artisan_id=artisan_id)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj
