from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead, OrderUpdate
from app.crud.order import list_orders, create_order, update_order_status, get_order

router = APIRouter()


@router.get("", response_model=list[OrderRead])
async def get_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the current artisan's orders."""
    orders = await list_orders(db, current_user.id)
    return orders


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def place_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Place a new order."""
    order = await create_order(db, current_user.id, data.model_dump())
    return order


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order(
    order_id: uuid.UUID,
    updates: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an order's status."""
    order = await get_order(db, order_id)
    if not order or order.artisan_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    updated = await update_order_status(db, order, updates.status)
    return updated
