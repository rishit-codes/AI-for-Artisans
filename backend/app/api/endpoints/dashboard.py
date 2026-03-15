from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import sqlalchemy as sa
from typing import Any

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = (
        select(
            func.count(Product.id).label("total_products"),
            func.coalesce(func.sum(Product.price * Product.stock_qty), 0).label("total_stock_value"),
            func.sum(sa.cast(Product.is_listed, sa.Integer)).label("listed_count"),
        )
        .where(Product.artisan_id == current_user.id)
    )
    result = await db.execute(stmt)
    agg_row = result.fetchone()

    total_products = agg_row.total_products if agg_row else 0
    total_stock_value = float(agg_row.total_stock_value) if agg_row else 0.0
    listed_count = int(agg_row.listed_count) if agg_row and agg_row.listed_count else 0
    unlisted_count = total_products - listed_count
    
    # Low stock items: fetch top 10 low stock
    low_stock_stmt = (
        select(Product.id, Product.name, Product.stock_qty)
        .where(Product.artisan_id == current_user.id, Product.stock_qty <= 3)
        .order_by(Product.stock_qty.asc())
        .limit(10)
    )
    low_stock_res = await db.execute(low_stock_stmt)
    low_stock_items = [{"id": row.id, "name": row.name, "stock_qty": row.stock_qty} for row in low_stock_res]

    # Recent products: fetch last 5
    recent_stmt = (
        select(Product.id, Product.name, Product.created_at)
        .where(Product.artisan_id == current_user.id)
        .order_by(Product.created_at.desc())
        .limit(5)
    )
    recent_res = await db.execute(recent_stmt)
    recent_products = [{"id": row.id, "name": row.name, "created_at": row.created_at} for row in recent_res]

    return {
        "total_products": total_products,
        "total_stock_value": total_stock_value,
        "listed_count": listed_count,
        "unlisted_count": unlisted_count,
        "low_stock_items": low_stock_items,
        "recent_products": recent_products
    }
