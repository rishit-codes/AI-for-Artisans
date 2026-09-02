import json
import re
import uuid
import logging
def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a model response, stripping markdown fences."""
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return json.loads(text)

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, timedelta
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.limiter import limiter
from app.models.user import User
from app.models.material import Material
from app.models.product import Product
from app.models.sale import Sale
from app.db.session import get_db
from app.services.festivals import get_days_to_next_festival
from app.crud.material import CRAFT_TYPE_TO_MATERIAL_CATEGORY
from app.models.plan_item import PlanItem
from app.schemas.advisor import (
    RecommendationOut, MaterialForCraft, RecentPace, AdvisorRecommendationsResponse,
    PlanItemCreate, PlanItemOut,
)

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

async def get_live_market_context(db: AsyncSession) -> Dict[str, str]:
    """
    Shared live-context fetch (weather + raw-material trends) used to ground
    both the /chat and /feed Groq prompts in real-world conditions.
    """
    m_result = await db.execute(select(Material))
    materials = m_result.scalars().all()
    mat_context = [f"{m.commodity_full_name or m.name}: {m.price} (Trend: {m.trend.upper()})" for m in materials]
    mat_str = ", ".join(mat_context) if mat_context else "No active tracking data."

    weather_str = "Clear, 30°C, 45% Humidity"
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            w_url = "https://api.open-meteo.com/v1/forecast?latitude=26.9124&longitude=75.7873&current=temperature_2m,relative_humidity_2m,precipitation"
            w_res = await client.get(w_url, timeout=3.0)
            if w_res.status_code == 200:
                w_data = w_res.json()
                curr = w_data.get("current", {})
                weather_str = f"Temp: {curr.get('temperature_2m', 30)}°C, Humidity: {curr.get('relative_humidity_2m', 45)}%, Precip: {curr.get('precipitation', 0)}mm"
    except Exception as e:
        logger.warning(f"Open-Meteo fetch failed: {e}")

    return {"weather": weather_str, "materials": mat_str}

async def stream_groq_response(messages: List[Dict[str, Any]], current_user: User, db: AsyncSession):
    import datetime
    current_date = datetime.datetime.now().strftime("%B %d, %Y")

    craft_type = current_user.craft_type if current_user and current_user.craft_type else "textile"
    fest_info = get_days_to_next_festival(craft_type)
    festival_context = f"The upcoming major festival for your craft is '{fest_info['name']}' which is {fest_info['days_away']} days away. " if fest_info else ""

    context = await get_live_market_context(db)

    user_name = current_user.full_name if current_user else "the user"
    system_prompt = (
        f"Today is {current_date}. "
        f"You are a production advisor speaking to {user_name}, an Indian {craft_type} artisan. "
        f"{festival_context}"
        f"Live local weather right now: {context['weather']}. "
        f"Live raw-material price trends: {context['materials']}. "
        "You help with craft techniques, material selection, production planning, and quality guidance. "
        "Factor the live weather into any advice about dyeing, drying, or clay curing, and factor the material "
        "trends into any advice about sourcing or stockpiling. "
        "Keep answers practical, concise, and relevant to traditional Indian crafts. "
        "CRITICAL: ALWAYS reply in the EXACT SAME LANGUAGE the user used in their most recent message. If they write in English, you MUST reply in English. If they write in Hindi, you MUST reply in Hindi. Do not mix languages."
    )

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    try:
        completion = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            stream=True,
        )
        
        async for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    except Exception as e:
        logger.error(f"Groq Stream Error: {e}")
        yield "I am sorry, I am having trouble connecting to the AI service."

@router.post("/chat", response_class=StreamingResponse)
@limiter.limit("20/minute")
async def chat_with_advisor(
    request: Request,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Build messages log
    messages = []
    for msg in chat_request.conversation_history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": chat_request.message})

    return StreamingResponse(
        stream_groq_response(messages, current_user, db),
        media_type="text/event-stream"
    )

@router.get("/feed")
@limiter.limit("20/minute")
async def get_advisor_feed(
    request: Request,
    artisan_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a dynamic production feed (timeline) via Groq LLM JSON-Mode. 
    It incorporates live materials prices and festival proximities.
    """
    try:
        # 1. Gather Context
        context = await get_live_market_context(db)
        mat_str = context["materials"]
        weather_str = context["weather"]

        craft_type = current_user.craft_type if current_user and current_user.craft_type else "textile"
        fest_info = get_days_to_next_festival(craft_type)
        days_to_festival = fest_info["days_away"] if fest_info else 30
        festival_name = fest_info["name"] if fest_info else "Upcoming Festival"

        import datetime
        current_date = datetime.datetime.now().strftime("%B %d, %Y")
        current_month = datetime.datetime.now().strftime("%B")

        # 2. Build Intelligent Prompt
        prompt = f"""You are an expert AI logistics and production advisor for a rural Indian {craft_type} artisan.
Today is {current_date}. Respond in the same language the user writes in (Hindi or English).
Current Context:
- Current Month: {current_month}
- Live Local Weather: {weather_str}
- Live Raw Material Trends: {mat_str}
- Next Major Sales Festival: '{festival_name}' is {days_to_festival} days away.

Based on this precise real-world context, generate a 3-step production timeline for the artisan:
Step 1: Focus on immediate action (Today) considering the exact weather.
Step 2: Focus on preparations (Tomorrow).
Step 3: Focus on macro goals (This Week) aiming for {festival_name}.

CRITICAL INSTRUCTIONS:
- If a raw material cost is trending UP, advise caution or substituting locally.
- If a raw material is trending DOWN or FLAT, advise stockpiling or pushing production.
- Very Important: It is {current_month}. NEVER suggest winter wear (like scarves or heavy wools) in hot seasons. Keep all suggestions strictly seasonally appropriate.
- Keep descriptions under 15 words.
- STRICT CHRONOLOGY REQUIRED: The output array MUST be ordered identically: [Index 0: TODAY, Index 1: TOMORROW, Index 2: THIS WEEK]. Do not mix the order.

You MUST output ONLY a valid JSON object containing exactly one key "feed" mapped to an array of 3 objects.
Each of the 3 objects must be structured identically to this schema, using appropriate dynamic content:
{{
  "timeLabel": "TODAY", // OR "TOMORROW" OR "THIS WEEK"
  "nodeColor": "icon-bg-blue", // Choose from icon-bg-blue, icon-bg-green, icon-bg-purple, icon-bg-yellow
  "type": "production", // Choose from "weather", "production", "sourcing", "quality"
  "title": "Short Punchy Title",
  "badge": {{ "label": "Short urgency label", "variant": "amber" }}, // variant must be green, amber, red, or blue
  "description": "15-word practical advice.",
  "pills": [
    {{ "label": "Cost Saver", "variant": "outline" }},
    {{ "label": "Action Needed", "variant": "secondary" }}
  ],
  "aiAdvice": "1 sentence specific tip about the material trends or festival proximity.",
  "estimatedTime": "e.g., 4 Hours",
  "workVolume": "e.g., Output: 10 units"
}}
"""
        
        # 3. Request LLM completion
        # Use demo key if one isn't set
        api_key = settings.GROQ_API_KEY
        client = AsyncGroq(api_key=api_key)
        
        completion = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        
        response_text = completion.choices[0].message.content
        data = _extract_json(response_text)
        return data.get("feed", [])
        
    except Exception as e:
        logger.error(f"Error generating dynamic advisor feed via Groq: {e}")
        # Graceful fallback to static if API key is invalid or rate-limited
        return [
            {
                "timeLabel": "TODAY",
                "nodeColor": "icon-bg-blue",
                "type": "weather",
                "title": "Optimal Dyeing Conditions",
                "badge": { "label": "Safe for Dyeing", "variant": "green" },
                "description": "Humidity is low. Perfect for drying outdoor batches today.",
                "pills": [
                    { "label": "☀️ 32°C", "variant": "outline" },
                    { "label": "💧 Low Humidity", "variant": "outline" }
                ]
            }
        ]


@router.get("/recommendations", response_model=AdvisorRecommendationsResponse)
async def get_advisor_recommendations(
    capacity: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Real, per-artisan production recommendations — grounded in the artisan's
    own listed products, the same demand-forecasting engine /predictions uses,
    the real festival calendar, and real logged sale costs. Replaces what used
    to be a hardcoded static array unrelated to the signed-in artisan.
    """
    import json as _json
    from app.ml.demand_forecasting import DemandForecaster

    craft_type = current_user.craft_type or "textile"

    bio: dict = {}
    if current_user.bio:
        try:
            bio = _json.loads(current_user.bio)
        except (_json.JSONDecodeError, TypeError):
            bio = {}
    if capacity is None:
        capacity = int(bio.get("advisorProfile", {}).get("capacity") or 20)

    products_res = await db.execute(
        select(Product)
        .where(Product.artisan_id == current_user.id, Product.is_listed == True)
        .order_by(Product.created_at.desc())
        .limit(6)
    )
    products = list(products_res.scalars().all())

    next_fest = get_days_to_next_festival(craft_type)
    trend_pct = round((next_fest["multiplier"] - 1) * 100) if next_fest and next_fest.get("multiplier") else None

    recommendations: List[RecommendationOut] = []
    for product in products:
        forecaster = DemandForecaster(str(current_user.id), str(product.id), craft_type, db)
        try:
            forecast_result = await forecaster.predict(horizon_days=30)
        except Exception as e:
            logger.warning(f"Advisor recommendation forecast failed for product {product.id}: {e}")
            forecast_result = {"forecast": [], "has_enough_data": False, "model_version": "category_prior_v1", "mape": None}

        forecast_points = forecast_result.get("forecast") or []
        suggested_batch = max(2, round(sum(p["demand"] for p in forecast_points[:14]))) if forecast_points else max(2, product.stock_qty // 4 or 2)

        mape = forecast_result.get("mape")
        if mape is not None:
            confidence = max(30, min(95, round(100 - min(mape, 1.5) * 100)))
        else:
            confidence = 50  # category-prior tier — real, but based on category pattern, not enough of the artisan's own sales yet

        cost_res = await db.execute(
            select(func.avg(Sale.unit_cost)).where(Sale.product_id == product.id, Sale.unit_cost.is_not(None))
        )
        avg_unit_cost = cost_res.scalar()

        rationale_parts = []
        if next_fest:
            rationale_parts.append(f"{next_fest['name']} is {next_fest['days_away']} days away")
            if trend_pct:
                rationale_parts.append(f"expected demand lift ~{trend_pct}% for {craft_type} around it")
        if not forecast_result.get("has_enough_data", True):
            rationale_parts.append("based on category pattern — log more sales for a personalized forecast")
        rationale = "; ".join(rationale_parts).capitalize() + "." if rationale_parts else "Based on your current listing and stock level."

        recommendations.append(RecommendationOut(
            product_id=product.id,
            product_name=product.name,
            material=product.material,
            image_url=product.image_url,
            unit_revenue=float(product.price),
            unit_cost=float(avg_unit_cost) if avg_unit_cost is not None else None,
            suggested_batch=round(suggested_batch * capacity / 20),
            confidence=confidence,
            trend_pct=trend_pct,
            festival=next_fest["name"] if next_fest else None,
            festival_days_away=next_fest["days_away"] if next_fest else None,
            rationale=rationale,
            model_version=forecast_result.get("model_version", "category_prior_v1"),
            has_enough_data=forecast_result.get("has_enough_data", False),
        ))

    recommendations.sort(key=lambda r: (r.trend_pct or 0) + r.confidence, reverse=True)

    # Real raw-material prices relevant to this craft (same mandi data as /materials/mandi)
    resolved_category = CRAFT_TYPE_TO_MATERIAL_CATEGORY.get(craft_type.strip().lower(), craft_type)
    mat_res = await db.execute(select(Material).where(Material.category == resolved_category))
    materials = [
        MaterialForCraft(
            commodity=m.commodity_full_name or m.name,
            sub=m.sub_unit,
            local_price=m.local_price,
            local_best=bool(m.local_best),
            surat_price=m.surat_price,
            surat_best=bool(m.surat_best),
            delhi_price=m.delhi_price,
            delhi_best=bool(m.delhi_best),
            trend=m.trend,
            action=m.action,
        )
        for m in mat_res.scalars().all() if m.local_price
    ]

    # The artisan's own recent pace (last 90 days) — not a cross-artisan
    # "cluster benchmark", since the platform doesn't have enough real users
    # per craft to make that a meaningful number yet.
    cutoff = date.today() - timedelta(days=90)
    pace_res = await db.execute(
        select(func.coalesce(func.sum(Sale.quantity), 0), func.coalesce(func.sum(Sale.quantity * Sale.price_per_unit), 0))
        .where(Sale.user_id == current_user.id, Sale.sale_date >= cutoff)
    )
    total_units, total_revenue = pace_res.one()
    recent_pace = RecentPace(
        avg_units_per_week=round(float(total_units) / (90 / 7), 1),
        avg_revenue_per_month=round(float(total_revenue) / 3, 2),
        weeks_of_history=round(90 / 7) if total_units else 0,
    )

    return AdvisorRecommendationsResponse(
        recommendations=recommendations,
        materials=materials,
        recent_pace=recent_pace,
    )


async def _plan_item_to_out(db: AsyncSession, item: PlanItem) -> PlanItemOut:
    product_res = await db.execute(select(Product).where(Product.id == item.product_id))
    product = product_res.scalar_one()
    cost_res = await db.execute(
        select(func.avg(Sale.unit_cost)).where(Sale.product_id == product.id, Sale.unit_cost.is_not(None))
    )
    avg_unit_cost = cost_res.scalar()
    return PlanItemOut(
        id=item.id,
        product_id=product.id,
        product_name=product.name,
        image_url=product.image_url,
        quantity=item.quantity,
        week=item.week,
        unit_revenue=float(product.price),
        unit_cost=float(avg_unit_cost) if avg_unit_cost is not None else None,
    )


@router.get("/plan", response_model=List[PlanItemOut])
async def get_plan(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    res = await db.execute(select(PlanItem).where(PlanItem.user_id == current_user.id).order_by(PlanItem.week))
    items = res.scalars().all()
    return [await _plan_item_to_out(db, item) for item in items]


@router.post("/plan", response_model=PlanItemOut, status_code=status.HTTP_201_CREATED)
async def add_to_plan(
    data: PlanItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    product_res = await db.execute(
        select(Product).where(Product.id == data.product_id, Product.artisan_id == current_user.id)
    )
    product = product_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    item = PlanItem(
        user_id=current_user.id,
        product_id=data.product_id,
        quantity=max(1, data.quantity),
        week=min(4, max(1, data.week)),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return await _plan_item_to_out(db, item)


@router.delete("/plan/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_plan(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    res = await db.execute(select(PlanItem).where(PlanItem.id == item_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Plan item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this plan item")
    await db.delete(item)
    await db.commit()
