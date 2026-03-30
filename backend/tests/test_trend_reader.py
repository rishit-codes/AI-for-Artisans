import pytest
import pandas as pd
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.sqlite import insert

from app.models.market_signal import MarketSignal
from app.services.trend_reader import get_trend_series
from app.services.market_signals_fetcher import NICHE_KEYWORDS

@pytest.mark.asyncio
async def test_trend_reader_forward_fill(client):
    from app.main import app
    from app.db.session import get_db
    
    db_gen = app.dependency_overrides.get(get_db, get_db)()
    db = await anext(db_gen)
    
    # insert 2 weekly rows for textile
    # Use the first niche name in the textile category as the key
    kw = list(NICHE_KEYWORDS["textile"].keys())[0]  # "Banarasi Silk"
    
    # Row 1: 2025-10-06 (Monday), score = 0.8
    # Row 2: 2025-10-13 (Monday), score = 0.4
    stmt = insert(MarketSignal).values([
        {"signal_type": "trend_score", "key": kw, "value": 0.8, "source": "test", "recorded_at": date(2025, 10, 6)},
        {"signal_type": "trend_score", "key": kw, "value": 0.4, "source": "test", "recorded_at": date(2025, 10, 13)}
    ])
    await db.execute(stmt)
    await db.commit()
    
    # Query for 14 day range: 2025-10-06 to 2025-10-19
    df = await get_trend_series("textile", date(2025, 10, 6), date(2025, 10, 19), db)
    
    assert len(df) == 14
    assert df.isnull().sum().sum() == 0 # no nulls
    
    # Day 0 to 6 should be 0.8
    assert df.loc[df['ds'] == '2025-10-06', 'trend_score'].iloc[0] == 0.8
    assert df.loc[df['ds'] == '2025-10-12', 'trend_score'].iloc[0] == 0.8
    
    # Day 7 to 13 should be 0.4
    assert df.loc[df['ds'] == '2025-10-13', 'trend_score'].iloc[0] == 0.4
    assert df.loc[df['ds'] == '2025-10-19', 'trend_score'].iloc[0] == 0.4

@pytest.mark.asyncio
async def test_trend_reader_cache_miss_neutral(client):
    from app.main import app
    from app.db.session import get_db
    
    db_gen = app.dependency_overrides.get(get_db, get_db)()
    db = await anext(db_gen)
    
    # empty cache
    df = await get_trend_series("home_decor_brassware", date(2025, 9, 1), date(2025, 9, 5), db)
    assert len(df) == 5
    assert all(df['trend_score'] == 0.5)
