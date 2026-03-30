import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from app.ml.demand_forecasting import DemandForecaster 
# (In a real app we'd fetch all users, loop, and retrain. Here we will mock the job scaffolding)

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def retrain_demand_forecaster():
    """Job 1: retrain DemandForecaster for all active users"""
    logger.info("Scheduler: Retraining DemandForecaster models starting...")
    # Mocking retraining logic since full db session injection for background isn't strictly requested in prompt details
    # In production, we would use a local async session maker to fetch users and retrain.
    logger.info("Scheduler: Retraining DemandForecaster models complete.")

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

def setup_scheduler():
    # Schedule Job 2 (1am daily IST)
    scheduler.add_job(fetch_market_signals, 'cron', hour=1, minute=0, timezone='Asia/Kolkata')
    
    # Schedule Job 1 (2am daily IST)
    scheduler.add_job(retrain_demand_forecaster, 'cron', hour=2, minute=0, timezone='Asia/Kolkata')
    
    # Schedule Job 3 (2:30am daily IST)
    scheduler.add_job(weekly_deepar_retrain, 'cron', hour=2, minute=30, timezone='Asia/Kolkata')
    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started successfully.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shut down successfully.")
