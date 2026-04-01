from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.material import CommodityRead, MandiComparisonRead
from app.crud.material import list_commodities, get_mandi_comparison
from app.services.commodity_fetcher import update_commodity_prices

router = APIRouter()


@router.get("/commodities", response_model=list[CommodityRead])
async def get_commodities(db: AsyncSession = Depends(get_db)):
    """Get all commodity price cards."""
    commodities = await list_commodities(db)
    return commodities


@router.get("/mandi", response_model=list[MandiComparisonRead])
async def get_mandi(
    category: str = Query("Textiles", description="Category: Textiles or Metals"),
    db: AsyncSession = Depends(get_db),
):
    """Get local mandi comparison data for a given category."""
    comparison = await get_mandi_comparison(db, category)
    return comparison

@router.post("/sync")
async def sync_live_commodities(db: AsyncSession = Depends(get_db)):
    """Manually trigger fetching live commodity prices from Alpha Vantage."""
    await update_commodity_prices(db)
    return {"status": "success", "message": "Live commodity prices successfully synced from Alpha Vantage"}
