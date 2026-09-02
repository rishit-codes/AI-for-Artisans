from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.models.order import Order
from app.schemas.order import OrderUpdate
from app.services.ws_manager import manager

VALID_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


async def list_orders(db: AsyncSession, artisan_id: uuid.UUID) -> list[Order]:
    result = await db.execute(
        select(Order).where(Order.artisan_id == artisan_id).order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def create_order(db: AsyncSession, artisan_id: uuid.UUID, data: dict) -> Order:
    order = Order(artisan_id=artisan_id, **data)
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


class InvalidOrderTransition(Exception):
    pass


async def update_order(db: AsyncSession, order: Order, data: OrderUpdate) -> Order:
    status_changed = data.status is not None and data.status != order.status
    if status_changed:
        allowed = VALID_TRANSITIONS.get(order.status, set())
        if data.status not in allowed:
            raise InvalidOrderTransition(f"Cannot move an order from '{order.status}' to '{data.status}'")
        order.status = data.status
        now = datetime.now(timezone.utc)
        if data.status == "shipped":
            order.shipped_at = now
        elif data.status == "delivered":
            order.delivered_at = now

    if data.carrier is not None:
        order.carrier = data.carrier
    if data.tracking_number is not None:
        order.tracking_number = data.tracking_number

    await db.commit()
    await db.refresh(order)

    # Only real marketplace purchases carry a buyer_id — an artisan's manually
    # logged offline sale (POST /orders) has no buyer account to notify.
    if status_changed and order.buyer_id:
        await manager.send_to_user(order.buyer_id, {
            "type": "order_status",
            "message": f"Your order #{str(order.id)[:8]} is now {order.status}",
            "order_id": str(order.id),
            "status": order.status,
        })
    return order


async def get_order(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
    result = await db.execute(select(Order).where(Order.id == order_id))
    return result.scalar_one_or_none()
