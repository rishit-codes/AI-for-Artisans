import logging
import asyncio
from typing import Dict
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

NICHE_KEYWORDS = {
    "pottery": {
        "Jaipur Blue Pottery": ["jaipur blue pottery", "blue pottery rajasthan"],
        "Khurja Ceramics": ["khurja pottery", "khurja ceramic"],
        "Black Clay Pottery": ["nizamabad black clay", "black clay pottery up"],
        "Northern Black Polished Ware": ["northern black polished ware", "nbpw pottery"]
    },
    "textile": {
        "Banarasi Silk": ["banarasi saree", "banarasi silk"],
        "Kanjeevaram Silk": ["kanjeevaram saree", "kanchipuram silk"],
        "Chikankari": ["chikankari embroidery", "lucknow chikan"],
        "Kalamkari": ["kalamkari fabric", "kalamkari hand block print"]
    },
    "home_decor_brassware": {
        "Dhokra Metalcraft": ["dhokra metal casting", "dhokra art"],
        "Moradabad Brassware": ["moradabad brassware", "brass decorative items"],
        "Bidriware": ["bidriware craft", "bidri metal craft"],
        "Saharanpur Wood Carving": ["saharanpur wood carving", "carved wood decor"]
    }
}

async def fetch_and_store_trends(category: str, niche: str, kw_list: list, db: AsyncSession) -> int:
    from app.models.market_signal import MarketSignal
    from pytrends.request import TrendReq
    
    rows_upserted = 0
    
    try:
        loop = asyncio.get_event_loop()
        
        def _fetch():
            pytrends = TrendReq(hl='en-US', tz=330)
            pytrends.build_payload(kw_list, timeframe='today 3-m')
            return pytrends.interest_over_time()
            
        df = await loop.run_in_executor(None, _fetch)
        
        if df.empty:
            logger.info(f"No trend data found for niche: {niche}")
            return 0
            
        if 'isPartial' in df.columns:
            df = df.drop(columns=['isPartial'])
            
        engine = db.get_bind()
        dialect = engine.dialect.name
        
        if dialect == 'postgresql':
            from sqlalchemy.dialects.postgresql import insert as sql_insert
        else:
            from sqlalchemy.dialects.sqlite import insert as sql_insert
            
        for date_idx, row in df.iterrows():
            week_start = date_idx.date()
            for kw in kw_list:
                if kw in df.columns:
                    val = float(row[kw]) / 100.0 # Normalize 0.0 - 1.0
                    
                    stmt = sql_insert(MarketSignal).values(
                        signal_type='trend_score',
                        key=niche,  # Now tracking the niche directly!
                        value=val,
                        source='pytrends',
                        recorded_at=week_start
                    )
                    
                    stmt = stmt.on_conflict_do_update(
                        index_elements=['signal_type', 'key', 'recorded_at'],
                        set_={'value': val}
                    )
                    
                    await db.execute(stmt)
                    rows_upserted += 1
                    
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to fetch trends for niche {niche}: {str(e)}")
        raise e
        
    return rows_upserted

async def fetch_all_crafts(db: AsyncSession) -> Dict[str, Dict[str, int]]:
    summary = {}
    for category, niches in NICHE_KEYWORDS.items():
        summary[category] = {}
        for niche, kw_list in niches.items():
            try:
                # To prevent rate limiting from pytrends, sleep between requests
                await asyncio.sleep(2)
                count = await fetch_and_store_trends(category, niche, kw_list, db)
                summary[category][niche] = count
            except Exception as e:
                logger.error(f"Error fetching trends for {niche}: {e}")
                summary[category][niche] = 0
    return summary
