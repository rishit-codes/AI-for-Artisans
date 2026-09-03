from fastapi import APIRouter, Depends, Request
import logging
import json
import re
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import httpx
from datetime import datetime, timedelta, timezone

def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a model response, stripping markdown fences."""
    # Strip ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    # Find the first { ... } block
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return json.loads(text)

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.product import Product
from app.models.user import User
from app.core.config import settings
from app.core.limiter import limiter

logger = logging.getLogger(__name__)
# Every route here spends Groq/Alpha Vantage quota on each uncached call —
# not meant to be reachable pre-login, and nothing public-facing calls into it.
router = APIRouter(dependencies=[Depends(get_current_user)])

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
            is_live = False
            try:
                url = f"https://www.alphavantage.co/query?function={commodity}&interval=monthly&apikey={api_key}"
                resp = await client.get(url, timeout=2.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if "data" in data and len(data["data"]) >= 2:
                        curr_val = float(data["data"][0]["value"])
                        prev_val = float(data["data"][1]["value"])
                        is_live = True
            except Exception as e:
                logger.error(f"Failed to fetch {commodity}: {e}")

            if curr_val is None or prev_val is None:
                curr_val, prev_val = get_mock_commodity(commodity)
                is_live = False

            curr_inr = curr_val * 83.5
            change = ((curr_val - prev_val) / prev_val) * 100
            trend_dir = "up" if change > 0 else "down" if change < 0 else "flat"
            trend_str = f"{abs(change):.1f}% {'↗' if change > 0 else '↘'}"

            status_text = "Price Drop" if trend_dir == "down" else "High Cost Alert" if trend_dir == "up" else "Stable"

            material_forecast.append({
                "name": commodity.capitalize().replace("_", " "),
                "price": f"₹{curr_inr:,.0f}",
                "status": status_text,
                "trend": trend_str,
                # Same live/estimated disclosure pattern as the mandi price system —
                # never silently present a rate-limit fallback number as a live one.
                "data_source": "live" if is_live else "estimated",
            })
            mat_context.append(f"{commodity} is currently ₹{curr_inr:,.0f} trending {trend_str}")

    mat_str = "; ".join(mat_context)

    if material_forecast:
        _commodity_cache_v2["data"] = material_forecast
        _commodity_cache_v2["mat_str"] = mat_str
        _commodity_cache_v2["timestamp"] = datetime.now()

    return mat_str, material_forecast

@router.get("/community")
async def get_community_trends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Real trends feed: a fresh random sample of up to 10 other artisans' live
    marketplace listings, reshuffled on every request. No LLM, no fabricated
    authors, no invented engagement numbers — every name and product here is
    a real account and a real product.stock_qty > 0 listing on the platform.
    """
    stmt = (
        select(Product, User)
        .join(User, User.id == Product.artisan_id)
        .where(
            Product.is_listed == True,
            Product.stock_qty > 0,
            Product.artisan_id != current_user.id,
        )
        .order_by(func.random())
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.all()

    cards = []
    for product, artisan in rows:
        created = product.created_at
        if created is not None:
            now = datetime.now(timezone.utc) if created.tzinfo is not None else datetime.utcnow()
            days_listed = max(0, (now - created).days)
        else:
            days_listed = None

        cards.append({
            "id": str(product.id),
            "artisan_id": str(artisan.id),
            "author": artisan.full_name,
            "craft_type": artisan.craft_type,
            "location": artisan.location,
            "product_name": product.name,
            "category": product.category,
            "material": product.material,
            "price": float(product.price),
            "image_url": product.image_url,
            "days_listed": days_listed,
        })
    return cards

@router.get("/intelligence")
@limiter.limit("15/minute")
async def get_intelligence(request: Request):
    """
    AI suggestion + raw material forecast sidebar data. The material forecast
    is always real (live Alpha Vantage rates, or an honestly-flagged
    "estimated" fallback per commodity if the API is down/rate-limited — see
    fetch_live_commodities). Only ai_suggestion depends on the LLM call
    succeeding; if it fails, we return null rather than a fabricated tip.
    """
    mat_str, material_forecast = await fetch_live_commodities()
    ai_suggestion = None

    try:
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
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )

        response_text = completion.choices[0].message.content
        data = _extract_json(response_text)
        ai_suggestion = data.get("ai_suggestion") or None

    except Exception as e:
        logger.error(f"Error generating dynamic intelligence via Groq: {e}")
        ai_suggestion = None

    return {
        "ai_suggestion": ai_suggestion,
        "material_forecast": material_forecast,
    }
