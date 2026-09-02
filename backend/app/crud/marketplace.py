import uuid
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.order import Order
from app.models.user import User
from app.schemas.marketplace import MarketplaceOrderCreate
from app.services.sandbox_payments import create_sandbox_payment
from app.services.ws_manager import manager


class ProductUnavailableError(Exception):
    pass


class InsufficientStockError(Exception):
    pass


class SelfPurchaseError(Exception):
    pass


class OrderNotPayableError(Exception):
    pass


async def list_marketplace_products(
    db: AsyncSession, category: Optional[str] = None, search: Optional[str] = None
) -> List[dict]:
    stmt = (
        select(Product, User)
        .join(User, User.id == Product.artisan_id)
        .where(Product.is_listed == True, Product.stock_qty > 0)
        .order_by(Product.created_at.desc())
    )
    if category:
        stmt = stmt.where(Product.category == category)
    if search:
        stmt = stmt.where(Product.name.ilike(f"%{search}%"))
    result = await db.execute(stmt)
    rows = []
    for product, artisan in result.all():
        rows.append({
            "id": product.id,
            "artisan_id": product.artisan_id,
            "artisan_name": artisan.full_name,
            "artisan_craft_type": artisan.craft_type,
            "artisan_location": artisan.location,
            "name": product.name,
            "material": product.material,
            "description": product.description,
            "category": product.category,
            "image_url": product.image_url,
            "price": product.price,
            "stock_qty": product.stock_qty,
            "created_at": product.created_at,
        })
    return rows


async def create_marketplace_order(db: AsyncSession, buyer: User, data: MarketplaceOrderCreate) -> Order:
    result = await db.execute(select(Product).where(Product.id == data.product_id))
    product = result.scalar_one_or_none()
    if not product or not product.is_listed:
        raise ProductUnavailableError("Product not found or no longer listed")
    if product.artisan_id == buyer.id:
        raise SelfPurchaseError("You can't buy your own product")
    if product.stock_qty < data.quantity:
        raise InsufficientStockError(f"Only {product.stock_qty} in stock")

    product.stock_qty -= data.quantity
    total_price = Decimal(str(product.price)) * data.quantity

    order = Order(
        artisan_id=product.artisan_id,
        buyer_id=buyer.id,
        product_id=product.id,
        quantity=data.quantity,
        total_price=total_price,
        currency="INR",
        status="pending",
        payment_status="pending",
        buyer_name=buyer.full_name,
        buyer_email=buyer.email,
        buyer_phone=data.buyer_phone,
        shipping_address=data.shipping_address,
        shipping_city=data.shipping_city,
        shipping_state=data.shipping_state,
        shipping_pincode=data.shipping_pincode,
    )
    db.add(product)
    db.add(order)
    await db.commit()
    await db.refresh(order)

    await manager.send_to_user(product.artisan_id, {
        "type": "new_order",
        "message": f"New order: {data.quantity}× {product.name} from {buyer.full_name}",
        "order_id": str(order.id),
    })
    return order


async def pay_for_order(db: AsyncSession, order: Order) -> Order:
    if order.payment_status != "pending":
        raise OrderNotPayableError(f"Order payment is already '{order.payment_status}'")
    order.payment_ref = create_sandbox_payment(order.total_price, order.currency)
    order.payment_status = "paid"
    order.status = "confirmed"
    db.add(order)
    await db.commit()
    await db.refresh(order)

    await manager.send_to_user(order.artisan_id, {
        "type": "order_paid",
        "message": f"Order #{str(order.id)[:8]} was paid — ready to fulfill",
        "order_id": str(order.id),
    })
    return order


async def list_my_purchases(db: AsyncSession, buyer_id: uuid.UUID) -> List[Order]:
    result = await db.execute(
        select(Order).where(Order.buyer_id == buyer_id).order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_order_for_buyer(db: AsyncSession, order_id: uuid.UUID, buyer_id: uuid.UUID) -> Optional[Order]:
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.buyer_id == buyer_id)
    )
    return result.scalar_one_or_none()
