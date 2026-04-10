"""
run_jobs_now.py — Manually trigger all ArtisanGPS scheduler jobs immediately.
Run from: d:\101\AI-for-Artisans\backend\
Command:  python run_jobs_now.py
"""
import asyncio
import logging
import sys
import os

# Make sure the app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("run_jobs_now")


async def run_job2_market_signals():
    """Job 2: PyTrends → market_signals table"""
    logger.info("=" * 60)
    logger.info("JOB 2: Fetching PyTrends market signals...")
    logger.info("=" * 60)
    try:
        from app.db.session import AsyncSessionLocal
        from app.services.market_signals_fetcher import fetch_all_crafts
        async with AsyncSessionLocal() as db:
            summary = await fetch_all_crafts(db)
        logger.info(f"[JOB 2 DONE] Summary: {summary}")
        return summary
    except Exception as e:
        logger.error(f"[JOB 2 FAILED] {e}")
        return {"error": str(e)}


async def run_job4_commodities():
    """Job 4: Alpha Vantage → Material table"""
    logger.info("=" * 60)
    logger.info("JOB 4: Fetching live commodity prices...")
    logger.info("=" * 60)
    try:
        from app.db.session import AsyncSessionLocal
        from app.services.commodity_fetcher import update_commodity_prices
        async with AsyncSessionLocal() as db:
            await update_commodity_prices(db)
        logger.info("[JOB 4 DONE] Commodity prices updated.")
        return "done"
    except Exception as e:
        logger.error(f"[JOB 4 FAILED] {e}")
        return {"error": str(e)}


async def check_db_results():
    """Show what's in the market_signals table after the jobs run."""
    logger.info("=" * 60)
    logger.info("DB CHECK: Reading market_signals table...")
    logger.info("=" * 60)
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.market_signal import MarketSignal
        from sqlalchemy import select, func

        async with AsyncSessionLocal() as db:
            # Count total rows
            total_q = await db.execute(select(func.count(MarketSignal.id)))
            total = total_q.scalar()

            # Sample some rows
            sample_q = await db.execute(
                select(MarketSignal)
                .order_by(MarketSignal.recorded_at.desc())
                .limit(10)
            )
            rows = sample_q.scalars().all()

        logger.info(f"Total rows in market_signals: {total}")
        logger.info("Latest 10 rows:")
        for r in rows:
            logger.info(
                f"  signal_type={r.signal_type!r:15} key={r.key!r:30} "
                f"value={float(r.value):.4f}  recorded_at={r.recorded_at}  source={r.source}"
            )
        return total
    except Exception as e:
        logger.error(f"DB check failed: {e}")
        return 0


async def main():
    logger.info("ArtisanGPS — Manual Job Runner")
    logger.info("Running Jobs 2 and 4 NOW...\n")

    # Job 2 first (pytrends → market_signals) — takes ~2 min due to rate-limit sleeps
    j2_result = await run_job2_market_signals()

    # Small gap
    await asyncio.sleep(1)

    # Job 4 (commodity prices → materials)
    j4_result = await run_job4_commodities()

    # Show DB state after
    await asyncio.sleep(1)
    total_rows = await check_db_results()

    logger.info("\n" + "=" * 60)
    logger.info("ALL JOBS COMPLETE")
    logger.info(f"  Job 2 (PyTrends): {j2_result}")
    logger.info(f"  Job 4 (Commodities): {j4_result}")
    logger.info(f"  market_signals rows now: {total_rows}")
    logger.info("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
