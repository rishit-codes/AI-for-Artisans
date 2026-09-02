import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def retrain_demand_forecaster():
    """Job 1: retrain SARIMAX (sarima_v1) models for every product with enough
    sales history — mirrors weekly_deepar_retrain's real, per-row, error-isolated
    pattern instead of the previous no-op stub."""
    logger.info("Scheduler: Retraining DemandForecaster models starting...")
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select, func
    from app.models.sale import Sale
    from app.models.user import User
    from app.ml.demand_forecasting import DemandForecaster, CATEGORY_PRIOR_THRESHOLD

    try:
        async with AsyncSessionLocal() as db:
            # Same threshold predict() uses to decide a product is on the SARIMAX
            # tier rather than the category-prior fallback — only those are worth
            # a scheduled retrain.
            query = (
                select(Sale.user_id, Sale.product_id, User.craft_type)
                .join(User, User.id == Sale.user_id)
                .group_by(Sale.user_id, Sale.product_id, User.craft_type)
                .having(func.count(Sale.id) >= CATEGORY_PRIOR_THRESHOLD)
            )
            res = await db.execute(query)
            eligible = res.all()

            retrained, failed = 0, 0
            for user_id, product_id, craft_type in eligible:
                try:
                    forecaster = DemandForecaster(user_id, product_id, craft_type or "textile", db)
                    await forecaster.train()
                    retrained += 1
                except Exception as e:
                    failed += 1
                    logger.error(f"SARIMAX retrain failed for {user_id}/{product_id}: {e}")

            logger.info(f"Scheduler: Retraining DemandForecaster models complete. {retrained} retrained, {failed} failed.")
    except Exception as e:
        logger.error(f"SARIMAX retrain wrapper failed: {e}")

async def fetch_market_signals():
    """Job 2: fetch pytrends -> market_signals table"""
    logger.info("Scheduler: Fetching external market signals starting...")
    from app.services.market_signals_fetcher import fetch_all_crafts
    from app.db.session import AsyncSessionLocal
    
    try:
        async with AsyncSessionLocal() as db:
            summary = await fetch_all_crafts(db)
            logger.info(f"Market signals updated: {summary}")
    except Exception as e:
        logger.error(f"Failed to fetch market signals: {e}")

async def weekly_deepar_retrain():
    """Job 3: Weekly DeepAR retrain"""
    logger.info("Scheduler: Evaluating DeepAR models for retrain...")
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.model_version import ModelVersion
    from app.ml.deepar_forecaster import DeepARForecaster
    from app.models.user import User
    
    try:
        async with AsyncSessionLocal() as db:
            # Active deepar users
            query = select(ModelVersion.user_id, ModelVersion.product_id, User.craft_type).join(
                User, User.id == ModelVersion.user_id
            ).where(
                ModelVersion.model_type == 'deepar_v1',
                ModelVersion.is_active == True
            )
            res = await db.execute(query)
            active_users = res.all()
            
            for user_id, product_id, craft_type in active_users:
                try:
                    f = DeepARForecaster(user_id, product_id, craft_type or "textile", db)
                    retrained = await f.retrain_if_stale()
                    if retrained:
                        logger.info(f"DeepAR retrained: {user_id}/{product_id}")
                except Exception as e:
                    logger.error(f"DeepAR retrain failed {user_id}/{product_id}: {e}")
    except Exception as e:
        logger.error(f"DeepAR retrain wrapper failed: {e}")

async def fetch_live_commodities():
    """Job 4: Fetch live commodity prices from Alpha Vantage"""
    logger.info("Scheduler: Fetching live commodities starting...")
    from app.db.session import AsyncSessionLocal
    from app.services.commodity_fetcher import update_commodity_prices
    
    try:
        async with AsyncSessionLocal() as db:
            await update_commodity_prices(db)
    except Exception as e:
        logger.error(f"Failed to fetch live commodities: {e}")

async def run_mandi_scraping_job():
    """Job 5: Fetch Agmarknet 5-city mandi rates & update audit logs"""
    logger.info("Scheduler: Executing 5-city mandi commodity scraper...")
    from app.db.session import AsyncSessionLocal
    from app.services.mandi_scraper import fetch_mandi_prices_async
    
    try:
        async with AsyncSessionLocal() as db:
            result = await fetch_mandi_prices_async(db)
            logger.info(f"5-City mandi scraping job completed: {result['log_count']} audit entries created.")
    except Exception as e:
        logger.error(f"Failed to execute mandi scraper job: {e}")

def setup_scheduler():
    # Schedule Job 2 (1am daily IST)
    scheduler.add_job(fetch_market_signals, 'cron', hour=1, minute=0, timezone='Asia/Kolkata')
    
    # Schedule Job 1 (2am daily IST)
    scheduler.add_job(retrain_demand_forecaster, 'cron', hour=2, minute=0, timezone='Asia/Kolkata')
    
    # Schedule Job 3 (2:30am daily IST)
    scheduler.add_job(weekly_deepar_retrain, 'cron', hour=2, minute=30, timezone='Asia/Kolkata')
    
    # Schedule Job 4 (3:00am daily IST)
    scheduler.add_job(fetch_live_commodities, 'cron', hour=3, minute=0, timezone='Asia/Kolkata')
    
    # Schedule Job 5 (Every 6 hours)
    scheduler.add_job(run_mandi_scraping_job, 'interval', hours=6)

    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started successfully.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shut down successfully.")

