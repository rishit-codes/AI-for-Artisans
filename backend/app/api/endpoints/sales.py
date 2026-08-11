import uuid
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Any, List

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.sale import Sale
from app.models.purchase import Purchase
from app.schemas.sale import SaleCreate, SaleResponse, SaleHistoryRow
from app.core.exceptions import ArtisanForbiddenError

router = APIRouter()

@router.get("/reports-summary")
async def get_reports_summary(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Real monthly revenue/cost/profit and category breakdown for the Reports page,
    computed from actual Sale and Purchase records — not mock data. "Cost" here is
    raw-material spend logged via the Purchases ledger (GST input tax credit source),
    not full COGS (labour/overhead aren't tracked anywhere in this app).
    """
    today = date.today()
    start_year, start_month = today.year, today.month - (months - 1)
    while start_month <= 0:
        start_month += 12
        start_year -= 1
    range_start = date(start_year, start_month, 1)

    month_keys = []
    y, m = start_year, start_month
    for _ in range(months):
        month_keys.append(f"{y:04d}-{m:02d}")
        m += 1
        if m > 12:
            m = 1
            y += 1

    sales_result = await db.execute(
        select(Sale.sale_date, Sale.quantity, Sale.price_per_unit, Product.category)
        .join(Product, Product.id == Sale.product_id, isouter=True)
        .where(Sale.user_id == current_user.id, Sale.sale_date >= range_start)
    )
    purchases_result = await db.execute(
        select(Purchase.purchase_date, Purchase.amount)
        .where(Purchase.artisan_id == current_user.id, Purchase.purchase_date >= range_start)
    )

    revenue_by_month = {k: 0.0 for k in month_keys}
    orders_by_month = {k: 0 for k in month_keys}
    category_totals: dict = {}

    for sale_date, quantity, price_per_unit, category in sales_result.all():
        key = sale_date.strftime("%Y-%m")
        revenue = float(quantity) * float(price_per_unit)
        if key in revenue_by_month:
            revenue_by_month[key] += revenue
            orders_by_month[key] += 1
        cat = category or "Uncategorized"
        entry = category_totals.setdefault(cat, {"revenue": 0.0, "units": 0})
        entry["revenue"] += revenue
        entry["units"] += quantity

    cost_by_month = {k: 0.0 for k in month_keys}
    for purchase_date, amount in purchases_result.all():
        key = purchase_date.strftime("%Y-%m")
        if key in cost_by_month:
            cost_by_month[key] += float(amount)

    monthly = []
    for key in month_keys:
        yy, mm = (int(x) for x in key.split("-"))
        revenue = round(revenue_by_month[key], 2)
        cost = round(cost_by_month[key], 2)
        monthly.append({
            "month": key,
            "label": date(yy, mm, 1).strftime("%b"),
            "revenue": revenue,
            "cost": cost,
            "profit": round(revenue - cost, 2),
            "orders": orders_by_month[key],
        })

    categories = [
        {"category": cat, "revenue": round(v["revenue"], 2), "units": v["units"]}
        for cat, v in sorted(category_totals.items(), key=lambda kv: -kv[1]["revenue"])
    ]

    total_products_result = await db.execute(
        select(func.count(Product.id)).where(Product.artisan_id == current_user.id)
    )
    total_revenue = sum(mo["revenue"] for mo in monthly)
    total_cost = sum(mo["cost"] for mo in monthly)

    return {
        "monthly": monthly,
        "categories": categories,
        "total_products": total_products_result.scalar() or 0,
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_revenue - total_cost, 2),
        "total_orders": sum(mo["orders"] for mo in monthly),
    }

@router.post("/record", response_model=SaleResponse)
async def record_sale(
    data: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Verify product belongs to current artisan
    result = await db.execute(select(Product).where(Product.id == data.product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.artisan_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized to sell this product")
    
    # Decrement stock_qty
    product.stock_qty -= data.quantity
    if product.stock_qty < 0:
        product.stock_qty = 0
    
    total_amount = float(data.quantity) * data.price_per_unit
    
    new_sale = Sale(
        user_id=current_user.id,
        product_id=data.product_id,
        quantity=data.quantity,
        price_per_unit=data.price_per_unit,
        channel=data.channel,
        sale_date=data.sale_date,
        notes=data.notes
    )
    
    db.add(new_sale)
    await db.commit()
    await db.refresh(new_sale)
    
    return SaleResponse(
        id=new_sale.id,
        total_amount=total_amount,
        profit=total_amount,
        updated_stock=product.stock_qty
    )

@router.get("/history", response_model=List[SaleHistoryRow])
async def sales_history(
    product_id: uuid.UUID = Query(None),
    from_date: date = Query(None),
    to_date: date = Query(None),
    limit: int = Query(90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    query = select(
        Sale.sale_date.label('ds_date'),
        func.sum(Sale.quantity).label('y')
    ).where(Sale.user_id == current_user.id)
    
    if product_id:
        query = query.where(Sale.product_id == product_id)
        query = query.add_columns(Sale.product_id)
        query = query.group_by(Sale.sale_date, Sale.product_id)
    else:
        from sqlalchemy import null
        query = query.add_columns(null().label('product_id'))
        query = query.group_by(Sale.sale_date)
    
    if from_date:
        query = query.where(Sale.sale_date >= from_date)
    if to_date:
        query = query.where(Sale.sale_date <= to_date)
        
    query = query.order_by('ds_date').limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    response = []
    for r in rows:
        ds_str = r.ds_date.strftime('%Y-%m-%d') if hasattr(r.ds_date, 'strftime') else str(r.ds_date)
        # Parse product_id safely
        prod_id = r.product_id if getattr(r, 'product_id', None) is not None else None
        
        response.append(SaleHistoryRow(
            ds=ds_str,
            y=float(r.y),
            product_id=prod_id
        ))
    return response
