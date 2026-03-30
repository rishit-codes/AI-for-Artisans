import logging
from math import isnan
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.models.market_signal import MarketSignal
from app.services.festivals import get_days_to_next_festival

router = APIRouter()
logger = logging.getLogger(__name__)

NICHE_CATEGORIES = {
    "pottery": [
        "Jaipur Blue Pottery",
        "Khurja Ceramics",
        "Black Clay Pottery",
        "Northern Black Polished Ware"
    ],
    "textile": [
        "Banarasi Silk",
        "Kanjeevaram Silk",
        "Chikankari",
        "Kalamkari"
    ],
    "home_decor_brassware": [
        "Dhokra Metalcraft",
        "Moradabad Brassware",
        "Bidriware",
        "Saharanpur Wood Carving"
    ]
}

@router.get("/insights")
async def get_market_insights(
    category: str = Query(..., description="Category like 'pottery', 'textile', or 'home_decor_brassware'"),
    db: AsyncSession = Depends(get_db)
):
    if category.lower() not in NICHE_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category '{category}'. Valid categories are: {list(NICHE_CATEGORIES.keys())}")
        
    niches = NICHE_CATEGORIES[category.lower()]
    
    # Get upcoming festival for this category
    next_fest = get_days_to_next_festival(category.lower())
    festival_proximity_boost = 0.0
    upcoming_season = "None"
    
    if next_fest:
        upcoming_season = next_fest["name"]
        # Closer festival = higher boost (max 40 points if 0 days away, scaling down to 0 at 90 days away)
        days_away = max(0, min(90, next_fest["days_away"]))
        festival_proximity_boost = 40.0 * (1.0 - (days_away / 90.0))
        # Multiply by festival multiplier to give big festivals (Diwali) more weight
        festival_proximity_boost *= (next_fest["multiplier"] / 2.0)
    
    insights = []
    
    for niche in niches:
        # Fetch last 30 days of trend scores for this niche
        thirty_days_ago = datetime.now(timezone.utc).date() - timedelta(days=30)
        
        query = select(MarketSignal).where(
            MarketSignal.signal_type == 'trend_score',
            MarketSignal.key == niche,
            MarketSignal.recorded_at >= thirty_days_ago
        ).order_by(desc(MarketSignal.recorded_at))
        
        res = await db.execute(query)
        signals = res.scalars().all()
        
        # Calculate momentum
        trend_momentum = 0.0
        momentum_str = "0%"
        base_trend = 50.0  # default neutral
        
        if signals and len(signals) >= 2:
            # Sort chronological
            signals.sort(key=lambda x: x.recorded_at)
            
            latest_val = float(signals[-1].value) * 100.0
            oldest_val = float(signals[0].value) * 100.0
            
            base_trend = latest_val
            
            if oldest_val > 0:
                perc_change = ((latest_val - oldest_val) / oldest_val) * 100.0
                trend_momentum = min(100.0, max(-100.0, perc_change))
                momentum_str = f"+{perc_change:.0f}%" if perc_change > 0 else f"{perc_change:.0f}%"
        
        # Calculate confidence score (0-100)
        momentum_bonus = max(0.0, trend_momentum * 0.2)
        trend_component = min(60.0, (base_trend * 0.6) + momentum_bonus)
        
        raw_score = trend_component + festival_proximity_boost
        confidence_score = min(100, int(max(0, raw_score)))
        
        status = "stable"
        if confidence_score >= 80:
            status = "capturing_market"
        elif confidence_score >= 60:
            status = "trending_up"
        elif confidence_score < 40:
            status = "cooling_down"
            
        insights.append({
            "niche": niche,
            "status": status,
            "trend_momentum": momentum_str,
            "upcoming_season": upcoming_season,
            "confidence_score": confidence_score
        })
        
    insights.sort(key=lambda x: x["confidence_score"], reverse=True)
    
    return {
        "category": category,
        "insights": insights
    }
