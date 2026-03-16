from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.order import Order


async def list_orders(db: AsyncSession, artisan_id: uuid.UUID) -> list[Order]:
    result = await db.execute(
        select(Order).where(Order.artisan_id == artisan_id).order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def create_order(db: AsyncSession, artisan_id: uuid.UUID, data: dict) -> Order:
    order = Order(artisan_id=artisan_id, **data)
    db.add(order)
    await db.flush()
    await db.refresh(order)
    return order


async def update_order_status(db: AsyncSession, order: Order, status: str) -> Order:
    order.status = status
    await db.flush()
    await db.refresh(order)
    return order


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
    result = await db.execute(select(Order).where(Order.id == order_id))
    return result.scalar_one_or_none()
