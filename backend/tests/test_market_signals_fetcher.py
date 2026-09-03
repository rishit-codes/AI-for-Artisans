import pytest
import pandas as pd
from unittest.mock import patch
from sqlalchemy import select, func
from app.models.market_signal import MarketSignal
from app.services.market_signals_fetcher import fetch_and_store_trends, NICHE_KEYWORDS

@pytest.mark.asyncio
async def test_fetch_and_store_trends_idempotent(client, db_session):
    # A real niche with two keyword variants, so this also exercises the
    # averaging behaviour: both keywords write into the same (niche, date)
    # row (there's no per-keyword column in MarketSignal), so their scores
    # must be combined rather than one silently overwriting the other.
    niche = "Banarasi Silk"
    kw_list = NICHE_KEYWORDS["textile"][niche]
    assert kw_list == ["banarasi saree", "banarasi silk"]

    mock_df = pd.DataFrame(
        {
            kw_list[0]: [80, 90],
            kw_list[1]: [40, 50],
            "isPartial": [False, False],
        },
        index=pd.to_datetime(["2025-10-06", "2025-10-13"]),
    )

    with patch('app.services.market_signals_fetcher.TrendReq') as MockTrendReq:
        mock_instance = MockTrendReq.return_value
        mock_instance.interest_over_time.return_value = mock_df

        # Run 1 — one upserted row per date (2 dates), not per keyword
        upserted1 = await fetch_and_store_trends("textile", niche, kw_list, db_session)
        assert upserted1 == 2

        # Run 2 — same dates re-processed; upsert must not duplicate rows
        upserted2 = await fetch_and_store_trends("textile", niche, kw_list, db_session)
        assert upserted2 == 2

        result = await db_session.execute(
            select(func.count(MarketSignal.id)).where(MarketSignal.signal_type == 'trend_score')
        )
        count = result.scalar()
        assert count == 2

        # The stored value is the average of the two keyword variants for
        # that date: (80/100 + 40/100) / 2 = 0.60 for 2025-10-06.
        row = (await db_session.execute(
            select(MarketSignal).where(MarketSignal.key == niche, MarketSignal.recorded_at == pd.Timestamp("2025-10-06").date())
        )).scalar_one()
        assert round(float(row.value), 4) == 0.60
