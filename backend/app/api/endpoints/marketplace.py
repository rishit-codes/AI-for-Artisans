import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.marketplace import MarketplaceProductRead, MarketplaceOrderCreate
from app.schemas.order import OrderRead
from app.crud.marketplace import (
    list_marketplace_products, create_marketplace_order, pay_for_order,
    list_my_purchases, get_order_for_buyer,
    ProductUnavailableError, InsufficientStockError, SelfPurchaseError, OrderNotPayableError,
)
from app.core.limiter import limiter

# Every route here requires a real signed-in account — there is no guest
# checkout, matching the "real buyer accounts" scope for this feature.
router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/products", response_model=list[MarketplaceProductRead])
async def browse_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Browse listed, in-stock products across all artisans."""
    return await list_marketplace_products(db, category=category, search=search)


@router.post("/orders", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def place_marketplace_order(
    request: Request,
    data: MarketplaceOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Place a real order as a buyer against another artisan's product."""
    try:
        return await create_marketplace_order(db, current_user, data)
    except ProductUnavailableError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except SelfPurchaseError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except InsufficientStockError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/orders/{order_id}/pay", response_model=OrderRead)
@limiter.limit("10/minute")
async def pay_marketplace_order(
    request: Request,
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run the order's total through the sandbox payment gateway."""
    order = await get_order_for_buyer(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    try:
        return await pay_for_order(db, order)
    except OrderNotPayableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/orders", response_model=list[OrderRead])
async def my_purchases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List the current user's own purchase history (as a buyer)."""
    return await list_my_purchases(db, current_user.id)
