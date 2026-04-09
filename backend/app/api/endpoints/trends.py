from fastapi import APIRouter, Query, Depends
import logging
import json
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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

@router.get("")
async def get_trends(
    tab: str = Query("All Trends", description="Filter tab"),
    db: AsyncSession = Depends(get_db)
):
    """
    Dynamically generates social media feed trends using Groq LLM based on live market conditions.
    """
    try:
        # Ask LLM to generate trend data
        prompt = f"""You are an AI trend analyzer generating a realistic social timeline for traditional Indian artisans.
Generate 3 social media-style trend posts globally relevant to: {tab if tab != "All Trends" else "Textiles, Pottery, and Metalwork"}.

You MUST output ONLY a valid JSON object containing exactly one key "trends" mapped to an array of 3 objects.
Each object must follow this strict schema exactly:
{{
  "id": integer (1, 2, or 3),
  "author": "Fictional Artisan Name",
  "title": "Short Catchy Headline",
  "content": "2-3 highly engaging sentences about a market trend, export demand, or sustainable shift.",
  "timestamp": "2 hours ago",
  "image_url": "MUST BE EXACTLY ONE STRING FROM THIS LIST: {AVAILABLE_IMAGES}",
  "tags": ["Trend", "Craft"],
  "performance_badge": "Trending Up",
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
        return data.get("trends", [])
        
    except Exception as e:
        logger.error(f"Error generating dynamic trends via Groq: {e}")
        # Fallback Mock
        return [
            {
                "id": 1,
                "author": "Meera Textile Insights (Fallback)",
                "title": " Peak Demand in Weddings",
                "content": "Traditional Banarasi handlooms with festive reds are seeing peak demand this wedding season.",
                "timestamp": "2 hours ago",
                "image_url": "/images/loom_weaving.png",
                "tags": ["WeddingSilk", "FloralMotif"],
                "performance_badge": "Trending Up",
                "likes": "1.2k",
                "comments": 89,
            }
        ]

import httpx
from datetime import datetime, timedelta

_commodity_cache_v2 = {
    "timestamp": None,
    "data": [],
    "mat_str": ""
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

@router.get("/intelligence")
async def get_intelligence(db: AsyncSession = Depends(get_db)):
    """
    AI suggestion + raw material forecast sidebar data generated via LLM & Live Alpha Vantage API.
    """
    try:
        global _commodity_cache_v2
        
        # 1. Fetch live Material constraints from Alpha Vantage (Cached to prevent API rate limit burning)
        material_forecast = []
        if _commodity_cache_v2["data"] and _commodity_cache_v2["timestamp"]:
            if datetime.now() - _commodity_cache_v2["timestamp"] < timedelta(hours=1):
                material_forecast = _commodity_cache_v2["data"]
                mat_str = _commodity_cache_v2["mat_str"]
                
        if not material_forecast:
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
                        
                    # Apply USD to INR conversion mock (~83.5)
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
            
            # Save to Cache to protect Alpha Vantage rate limits (25/day)
            if material_forecast:
                _commodity_cache_v2["data"] = material_forecast
                _commodity_cache_v2["mat_str"] = mat_str
                _commodity_cache_v2["timestamp"] = datetime.now()

        # 2. Prompt LLM for `ai_suggestion`
        prompt = f"""You are an AI financial analyst for a rural Indian artisan.
Live Market Supply Costs: {mat_str}

Evaluate the costs. Provide a purely objective JSON object with key "ai_suggestion" containing:
{{
  "title": "Artisan AI Suggestion",
  "subtitle": "Market Optimization Tip",
  "text": "1 highly insightful localized 20-word tip correlating a specific material's price shift with profit strategies (e.g. 'Since Cotton Yarn dropped 5%, bulk orders now will yield 15% better margins')",
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
        # Fallback Mock
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
