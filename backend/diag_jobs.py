"""Quick diagnostic - test pytrends directly"""
import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("diag")

async def test_pytrends():
    logger.info("Testing pytrends import...")
    try:
        from pytrends.request import TrendReq
        logger.info("pytrends imported OK")
    except ImportError as e:
        logger.error(f"pytrends NOT installed: {e}")
        return

    logger.info("Testing pytrends request (banarasi silk, 3 months)...")
    try:
        loop = asyncio.get_event_loop()
        def _fetch():
            pt = TrendReq(hl='en-US', tz=330)
            pt.build_payload(['banarasi saree'], timeframe='today 3-m')
            df = pt.interest_over_time()
            return df
        df = await loop.run_in_executor(None, _fetch)
        logger.info(f"Result shape: {df.shape}")
        logger.info(f"Sample:\n{df.head()}")
    except Exception as e:
        logger.error(f"pytrends request FAILED: {type(e).__name__}: {e}")

async def test_db():
    logger.info("Testing DB connection + AsyncSessionLocal...")
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.market_signal import MarketSignal
        from sqlalchemy import select, func
        async with AsyncSessionLocal() as db:
            r = await db.execute(select(func.count(MarketSignal.id)))
            count = r.scalar()
            logger.info(f"market_signals row count = {count}")
    except Exception as e:
        logger.error(f"DB test FAILED: {type(e).__name__}: {e}")

async def test_upsert():
    logger.info("Testing manual upsert into market_signals...")
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.market_signal import MarketSignal
        from sqlalchemy.dialects.sqlite import insert as sql_insert
        from datetime import date
        async with AsyncSessionLocal() as db:
            stmt = sql_insert(MarketSignal).values(
                signal_type='trend_score',
                key='Banarasi Silk',
                value=0.75,
                source='test',
                recorded_at=date.today()
            ).on_conflict_do_update(
                index_elements=['signal_type', 'key', 'recorded_at'],
                set_={'value': 0.75}
            )
            await db.execute(stmt)
            await db.commit()
            logger.info("Upsert SUCCESS — test row written")
    except Exception as e:
        logger.error(f"Upsert FAILED: {type(e).__name__}: {e}")

async def main():
    await test_db()
    await test_pytrends()
    await test_upsert()
    await test_db()  # Check again after upsert

if __name__ == "__main__":
    asyncio.run(main())
