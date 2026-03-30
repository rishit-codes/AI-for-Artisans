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
from app.schemas.sale import SaleCreate, SaleResponse, SaleHistoryRow
from app.core.exceptions import ArtisanForbiddenError

router = APIRouter()

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
