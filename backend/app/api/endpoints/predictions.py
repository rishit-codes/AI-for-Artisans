import uuid
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from sqlalchemy import select, func
from pydantic import BaseModel

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.ml.demand_forecasting import DemandForecaster
from app.core.exceptions import ArtisanForbiddenError
from app.models.sale import Sale
from app.models.model_version import ModelVersion

router = APIRouter()

class TriggerUpgradeRequest(BaseModel):
    product_id: uuid.UUID

@router.post("/trigger-upgrade")
async def trigger_upgrade(
    req: TriggerUpgradeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Verify product ownership
    result = await db.execute(select(Product).where(Product.id == req.product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.artisan_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized")
        
    # Check count
    count_res = await db.execute(select(func.count(Sale.id)).where(Sale.user_id == current_user.id, Sale.product_id == req.product_id))
    count = count_res.scalar() or 0
    
    if count >= 60:
        # Enqueue deepar upgrade
        # background_tasks.add_task(run_deepar_upgrade, current_user.id, req.product_id, current_user.craft_type or "textile")
        return {"upgrade_queued": True, "record_count": count}
    else:
        return {"upgrade_queued": False, "record_count": count, "records_needed": 60 - count}

@router.get("/seasonal")
async def get_seasonal_prediction(
    product_id: uuid.UUID = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Verify product ownership
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.artisan_id != current_user.id:
        raise ArtisanForbiddenError(detail="Not authorized to predict for this product")

    craft_type = current_user.craft_type or "textile"
    
    # Load active model version from DB
    active_query = select(ModelVersion).where(
        ModelVersion.user_id == current_user.id,
        ModelVersion.product_id == product_id,
        ModelVersion.is_active == True
    )
    active_res = await db.execute(active_query)
    active = active_res.scalar_one_or_none()
    
    if active and active.model_type == "deepar_v1":
        from app.ml.deepar_forecaster import DeepARForecaster
        forecaster = DeepARForecaster(user_id=current_user.id, product_id=product_id, craft_type=craft_type, db=db)
    else:
        forecaster = DemandForecaster(user_id=current_user.id, product_id=product_id, craft_type=craft_type, db=db)
    
    prediction_result = await forecaster.predict(horizon_days=90)
    
    record_count_res = await db.execute(select(func.count(Sale.id)).where(Sale.user_id == current_user.id, Sale.product_id == product_id))
    record_count = record_count_res.scalar() or 0
    
    prediction_result["model_type"] = active.model_type if active else "sarima_v1"
    prediction_result["upgrade_available"] = (
        record_count >= 60 and (not active or active.model_type == "sarima_v1")
    )
    prediction_result["records_to_upgrade"] = max(0, 60 - record_count)
    
    return prediction_result
