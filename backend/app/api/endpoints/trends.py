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
Each object must follow this strict schema:
{{
  "id": integer (1 to 3),
  "author_name": "Fictional Business Name",
  "author_initial": "F",
  "category": "Keyword Category",
  "posted_ago": "2 hours ago",
  "image_url": "CHOOSE ONE OF: {AVAILABLE_IMAGES}",
  "body_text": "2-3 highly engaging sentences about a market trend, export demand, or sustainable shift.",
  "tags": ["#Trend", "#Craft"],
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
                "author_name": "Meera Textile Insights (Fallback)",
                "author_initial": "M",
                "category": "Wedding Season",
                "posted_ago": "2 hours ago",
                "image_url": "/images/loom_weaving.png",
                "body_text": (
                    "Traditional Banarasi handlooms with festive reds are seeing peak demand this wedding season."
                ),
                "tags": ["#WeddingSilk", "#FloralMotif"],
                "likes": "1.2k",
                "comments": 89,
            }
        ]

@router.get("/intelligence")
async def get_intelligence(db: AsyncSession = Depends(get_db)):
    """
    AI suggestion + raw material forecast sidebar data generated via LLM & Live DB Constraints.
    """
    try:
        # 1. Fetch live Material constraints
        m_result = await db.execute(select(Material))
        materials = m_result.scalars().all()
        
        mat_context = []
        material_forecast = []
        
        for m in materials:
            status_text = "Price Drop" if m.trend == "down" else "High Cost Alert" if m.trend == "up" else "Stable"
            material_forecast.append({
                "name": m.commodity_full_name or m.name,
                "price": m.price,
                "status": status_text,
                "trend": f"{m.change_pct} {'↗' if 'up' in m.trend else '↘' if 'down' in m.trend else '→'}"
            })
            mat_context.append(f"{m.commodity_full_name} is currently {m.price} tracking {m.change_pct} ({m.trend})")
            
        mat_str = "; ".join(mat_context) if mat_context else "No active tracking data."

        # 2. Groq AI suggestion — isolated so live DB material data is ALWAYS returned
        ai_suggestion = {
            "title": "Artisan AI Suggestion",
            "subtitle": "Market Optimization Tip",
            "text": f"Based on live data, plan purchases wisely: {mat_str[:100]}",
            "action": "Calculate Potential Profit",
        }
        try:
            api_key = settings.GROQ_API_KEY
            client = AsyncGroq(api_key=api_key)
            prompt = (
                "You are an AI analyst for Indian artisans. "
                f"Live supply costs: {mat_str}. "
                'Return JSON with key "ai_suggestion": {title, subtitle, text (1 localized 20-word profit tip), action}.'
            )
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            groq_data = json.loads(completion.choices[0].message.content)
            ai_suggestion = groq_data.get("ai_suggestion", ai_suggestion)
        except Exception as groq_err:
            logger.warning(f"Groq AI failed, using data-driven fallback: {groq_err}")

        return {
            "ai_suggestion": ai_suggestion,
            "material_forecast": material_forecast,
        }

    except Exception as e:
        logger.error(f"Intelligence endpoint DB error: {e}")
        return {
            "ai_suggestion": {
                "title": "Artisan AI Suggestion",
                "subtitle": "Service temporarily unavailable",
                "text": "Market data is loading. Please check back shortly.",
                "action": "Retry",
            },
            "material_forecast": [
                {"name": "Service Unavailable", "price": "—", "status": "Retry shortly", "trend": "→"}
            ],
        }
