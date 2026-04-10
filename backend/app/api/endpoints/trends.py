from fastapi import APIRouter, Query, Depends
import logging
import json
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from datetime import datetime, timedelta
import random

from app.db.session import get_db
from app.models.material import Material
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

AVAILABLE_IMAGES = [
    "/images/loom_weaving.png",
    "/images/natural_dyes.png",
    "/images/block_print.png",
    "/images/banarasi_saree.jpg",
    "/images/terracotta_pot.jpg"
]

_commodity_cache_v2 = {
    "timestamp": None,
    "data": [],
    "mat_str": ""
}

_trends_cache = {
    "timestamp": None,
    "data": []
}

def get_mock_commodity(c):
    # Base fallback prices if Alpha Vantage API limit is reached
    mocks = {
        "COTTON": (73.0, 74.5), 
        "COPPER": (8500.0, 8300.0), 
        "ALUMINUM": (3000.0, 3100.0), 
        "NATURAL_GAS": (2.1, 2.0)
    }
    return mocks.get(c, (100.0, 100.0))

async def fetch_live_commodities():
    global _commodity_cache_v2
    
    # 1. Fetch live Material constraints from Alpha Vantage (Cached to prevent API rate limit burning)
    material_forecast = []
    mat_str = ""
    
    if _commodity_cache_v2["data"] and _commodity_cache_v2["timestamp"]:
        if datetime.now() - _commodity_cache_v2["timestamp"] < timedelta(hours=1):
            return _commodity_cache_v2["mat_str"], _commodity_cache_v2["data"]
            
    mat_context = []
    api_key = settings.ALPHA_VANTAGE_API_KEY
    # Commodities critical to local Indian artisans (Textile, Jewelry, Metalcraft, Pottery kilns)
    commodities = ["COTTON", "COPPER", "ALUMINUM", "NATURAL_GAS"]
    
    async with httpx.AsyncClient() as client:
        for commodity in commodities:
            curr_val, prev_val = None, None
            try:
                url = f"https://www.alphavantage.co/query?function={commodity}&interval=monthly&apikey={api_key}"
                resp = await client.get(url, timeout=4.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if "data" in data and len(data["data"]) >= 2:
                        curr_val = float(data["data"][0]["value"])
                        prev_val = float(data["data"][1]["value"])
            except Exception as e:
                logger.error(f"Failed to fetch {commodity}: {e}")
            
            if curr_val is None or prev_val is None:
                curr_val, prev_val = get_mock_commodity(commodity)
                
            curr_inr = curr_val * 83.5
            change = ((curr_val - prev_val) / prev_val) * 100
            trend_dir = "up" if change > 0 else "down" if change < 0 else "flat"
            trend_str = f"{abs(change):.1f}% {'↗' if change > 0 else '↘'}"
            
            status_text = "Price Drop" if trend_dir == "down" else "High Cost Alert" if trend_dir == "up" else "Stable"
            
            material_forecast.append({
                "name": commodity.capitalize().replace("_", " "),
                "price": f"₹{curr_inr:,.0f}",
                "status": status_text,
                "trend": trend_str
            })
            mat_context.append(f"{commodity} is currently ₹{curr_inr:,.0f} trending {trend_str}")

    mat_str = "; ".join(mat_context)
    
    if material_forecast:
        _commodity_cache_v2["data"] = material_forecast
        _commodity_cache_v2["mat_str"] = mat_str
        _commodity_cache_v2["timestamp"] = datetime.now()

    return mat_str, material_forecast

def get_indian_breakout_trends(tab: str) -> str:
    """Fetch real-time breakout trends for the Indian market using pytrends."""
    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl='en-US', tz=330, timeout=(5,10))
        kw = tab if tab != "All Trends" else "Handicrafts"
        
        # Pytrends can be fickle, adding a safety layer
        pytrends.build_payload([kw], cat=0, timeframe='now 7-d', geo='IN')
        related = pytrends.related_queries()
        
        rel_data = related.get(kw, {})
        rising = rel_data.get('rising')
        if rising is not None and not rising.empty:
            top_queries = rising['query'].head(3).tolist()
            return ", ".join(top_queries)
        return ""
    except Exception as e:
        logger.error(f"Pytrends failed to fetch breakout trends: {e}")
        return ""

async def fetch_unsplash_image(query: str) -> str:
    """Fetch a high-res image URL from Unsplash using the search query."""
    if not settings.UNSPLASH_API_KEY:
        return random.choice(AVAILABLE_IMAGES)
        
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.unsplash.com/search/photos?page=1&query={query}&client_id={settings.UNSPLASH_API_KEY}&per_page=1"
            resp = await client.get(url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                if results and len(results) > 0:
                    return results[0]["urls"]["regular"]
    except Exception as e:
        logger.error(f"Unsplash API failed: {e}")
        
    return random.choice(AVAILABLE_IMAGES)

@router.get("")
async def get_trends(
    tab: str = Query("All Trends", description="Filter tab"),
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically generates social media feed trends using Groq LLM based on live market conditions and Pytrends.
    """
    global _trends_cache
    
    # 1. Check if we have valid cached data under 10 minutes old
    if tab == "All Trends" and _trends_cache["data"] and _trends_cache["timestamp"]:
        if datetime.now() - _trends_cache["timestamp"] < timedelta(minutes=10):
            return _trends_cache["data"]

    try:
        mat_str, _ = await fetch_live_commodities()
        breakout_trends = get_indian_breakout_trends(tab)
        
        breakout_context = ""
        if breakout_trends:
            breakout_context = f"\nCRITICAL: Google Trends reports these exact queries are breaking out in India RIGHT NOW: {breakout_trends}. You MUST write posts about these specific items."

        # Ask LLM to generate trend data injected with live pricing
        if tab == "All Trends":
            quantity_instruction = "Generate exactly 9 realistic social media-style trend posts: 3 focused on Home Decor, 3 on Textiles, and 3 on Pottery."
        else:
            quantity_instruction = f"Generate exactly 3 realistic social media-style trend posts globally relevant to: {tab}."

        prompt = f"""You are an AI trend analyzer generating a realistic Instagram-style social timeline for traditional Indian artisans.
Use this REAL-TIME market data to influence the content: {mat_str}. {breakout_context}

{quantity_instruction}

You MUST output ONLY a valid JSON object containing exactly one key "trends" mapped to an array.
Each object must follow this strict schema exactly:
{{
  "id": integer,
  "author": "Fictional Indian Artisan Name",
  "title": "Short Catchy Headline",
  "content": "2-3 highly engaging sentences about a market trend, export demand, highlighting the real-world craft and data.",
  "timestamp": "Just now",
  "image_search": "A short 2-3 word query to search Unsplash for a high quality photo to match this post (e.g. 'Indian pottery', 'Tie dye fabric', 'Brass lamp')",
  "tags": ["Design", "India", "And exactly one of: HomeDecor, Textiles, or Pottery based on the post theme"],
  "performance_badge": "Trending Now",
  "likes": "1.2k",
  "comments": 89
}}
"""

        api_key = settings.GROQ_API_KEY
        client = AsyncGroq(api_key=api_key)
        
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.8,
        )
        
        response_text = completion.choices[0].message.content
        data = json.loads(response_text)
        trends = data.get("trends", [])
        
        import asyncio
        async def attach_image(t):
            search_query = t.get("image_search", "Indian traditional craft")
            t["image_url"] = await fetch_unsplash_image(search_query)

        await asyncio.gather(*(attach_image(t) for t in trends))
            
        # Optional validation to ensure we only cache if the LLM successfully generated array data
        if trends and len(trends) > 0 and tab == "All Trends":
            _trends_cache["data"] = trends
            _trends_cache["timestamp"] = datetime.now()
            
        return trends
        
    except Exception as e:
        logger.error(f"Error generating dynamic trends via Groq: {e}")
        return [
            {
                "id": 1,
                "author": "Meera Textile Insights",
                "title": " Peak Demand in Weddings",
                "content": "Traditional Banarasi handlooms with festive reds are seeing peak demand this wedding season, especially as Cotton stabilizes.",
                "timestamp": "2 hours ago",
                "image_url": "/images/loom_weaving.png",
                "tags": ["WeddingSilk", "FloralMotif"],
                "performance_badge": "Trending Up",
                "likes": "1,245",
                "comments": 89,
            }
        ]

@router.get("/intelligence")
async def get_intelligence(db: AsyncSession = Depends(get_db)):
    """
    AI suggestion + raw material forecast sidebar data generated via LLM & Live Alpha Vantage API.
    """
    try:
        mat_str, material_forecast = await fetch_live_commodities()

        prompt = f"""You are an AI financial analyst for a rural Indian artisan.
Live Market Supply Costs: {mat_str}

Evaluate the costs. Provide a purely objective JSON object with key "ai_suggestion" containing:
{{
  "title": "Artisan AI Suggestion",
  "subtitle": "Market Optimization Tip",
  "text": "1 highly insightful localized 20-word tip correlating a specific material's price shift with profit strategies.",
  "action": "Calculate Potential Profit"
}}
"""

        api_key = settings.GROQ_API_KEY
        client = AsyncGroq(api_key=api_key)
        
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        
        response_text = completion.choices[0].message.content
        data = json.loads(response_text)
        ai_suggestion = data.get("ai_suggestion", {})
        
        return {
            "ai_suggestion": ai_suggestion,
            "material_forecast": material_forecast,
        }
        
    except Exception as e:
        logger.error(f"Error generating dynamic intelligence via Groq: {e}")
        return {
            "ai_suggestion": {
                "title": "Artisan AI Suggestion",
                "subtitle": "Based on browsing history",
                "text": "The magenta lotus design has a higher profit margin using locally sourced raw silk.",
                "action": "Calculate Profit",
            },
            "material_forecast": [
                {"name": "Database Error", "price": "₹0", "status": "Failed to load", "trend": "0%"}
            ]
        }
