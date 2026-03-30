import logging
import pandas as pd
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.market_signal import MarketSignal
from app.services.market_signals_fetcher import NICHE_KEYWORDS

logger = logging.getLogger(__name__)

async def get_trend_series(
    craft_type: str,
    start_date: date,
    end_date: date,
    db: AsyncSession
) -> pd.DataFrame:
    """
    Returns DataFrame with columns [ds, trend_score] covering start_date to end_date.
    Reads from market_signals cache. Forward-fills weekly data into daily rows.
    Returns 0.5 flat line on cache miss.
    """
    # Check if craft_type is a category (e.g., "pottery") or a niche (e.g., "Jaipur Blue Pottery")
    keywords = []
    if craft_type.lower() in NICHE_KEYWORDS:
        # It's a category, aggregate all niches in it
        keywords = list(NICHE_KEYWORDS[craft_type.lower()].keys())
    else:
        # Check if it's a specific niche in any category
        for cat in NICHE_KEYWORDS.values():
            if craft_type in cat:
                keywords = [craft_type]
                break
    
    # Generate daily date range
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    df = pd.DataFrame({'ds': dates})
    df['trend_score'] = 0.5 # default neutral
    
    if not keywords:
        return df
        
    query = select(
        MarketSignal.recorded_at,
        func.avg(MarketSignal.value).label('avg_score')
    ).where(
        MarketSignal.signal_type == 'trend_score',
        MarketSignal.key.in_(keywords),
        # Pytrends returns weekly. Need to fetch slightly before start_date to forward fill
        MarketSignal.recorded_at <= end_date
    ).group_by(MarketSignal.recorded_at).order_by(MarketSignal.recorded_at)
    
    result = await db.execute(query)
    rows = result.all()
    
    if not rows:
        logger.warning(f"Cache miss for {craft_type} trends between {start_date} and {end_date}")
        return df
        
    # Convert fetched weekly rows to dataframe
    fetched_df = pd.DataFrame([{
        "ds": r.recorded_at,
        "weekly_score": float(r.avg_score)
    } for r in rows])
    
    fetched_df['ds'] = pd.to_datetime(fetched_df['ds'])
    
    # Merge and forward fill
    df = pd.merge(df, fetched_df, on='ds', how='left')
    df['weekly_score'] = df['weekly_score'].ffill()
    
    # If the first fetched date was after start_date, ffill won't catch it. bfill or keep default
    df['trend_score'] = df['weekly_score'].fillna(0.5)
    df.drop(columns=['weekly_score'], inplace=True)
    
    return df

async def get_trend_feature_df(
    craft_type: str,
    future_start: date,
    future_end: date,
    db: AsyncSession
) -> pd.DataFrame:
    """
    Same as get_trend_series but for future horizons. 
    Forward fills from the most recent week available in market_signals.
    """
    keywords = []
    if craft_type.lower() in NICHE_KEYWORDS:
        keywords = list(NICHE_KEYWORDS[craft_type.lower()].keys())
    else:
        for cat in NICHE_KEYWORDS.values():
            if craft_type in cat:
                keywords = [craft_type]
                break
    
    dates = pd.date_range(start=future_start, end=future_end, freq='D')
    df = pd.DataFrame({'ds': dates})
    df['trend_score'] = 0.5
    
    if not keywords:
        return df
        
    # Fetch just the single most recent week
    query = select(
        func.avg(MarketSignal.value).label('avg_score')
    ).where(
        MarketSignal.signal_type == 'trend_score',
        MarketSignal.key.in_(keywords),
        MarketSignal.recorded_at <= future_start
    ).group_by(MarketSignal.recorded_at).order_by(MarketSignal.recorded_at.desc()).limit(1)
    
    result = await db.execute(query)
    recent_score = result.scalar_one_or_none()
    
    if recent_score is not None:
        df['trend_score'] = float(recent_score)
    else:
        logger.warning(f"No historical trend to project forward for {craft_type}")
        
    return df
