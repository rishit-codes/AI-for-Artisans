import pytest
import pandas as pd
from datetime import datetime, date
from unittest.mock import patch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.market_signal import MarketSignal
from app.services.market_signals_fetcher import fetch_and_store_trends

@pytest.mark.asyncio
async def test_fetch_and_store_trends_idempotent(client, monkeypatch):
    from app.main import app
    from app.db.session import get_db
    
    # We need a db session. The easiest way is to use the dependency override from conftest
    # Or just get the generator
    db_gen = app.dependency_overrides.get(get_db, get_db)()
    db = await anext(db_gen)

    # Mock the pytrends df
    mock_df = pd.DataFrame(
        {
            "handloom saree": [80, 90],
            "block print fabric": [40, 50],
            "Indian textile": [60, 70],
            "isPartial": [False, False]
        },
        index=pd.to_datetime(["2025-10-06", "2025-10-13"])
    )

    with patch('app.services.market_signals_fetcher.TrendReq') as MockTrendReq:
        mock_instance = MockTrendReq.return_value
        mock_instance.interest_over_time.return_value = mock_df

        # Run 1
        upserted1 = await fetch_and_store_trends("textile", db)
        assert upserted1 == 6 # 3 keywords * 2 weeks

        # Run 2
        upserted2 = await fetch_and_store_trends("textile", db)
        assert upserted2 == 6 # logic returns rows processed, but db shouldn't clone

        # Verify idempotency
        result = await db.execute(select(func.count(MarketSignal.id)).where(MarketSignal.signal_type == 'trend_score'))
        count = result.scalar()
        assert count == 6
