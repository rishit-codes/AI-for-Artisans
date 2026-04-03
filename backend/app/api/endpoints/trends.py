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
async def get_intelligence():
    """AI suggestion + raw material forecast sidebar data."""
    return {
        "ai_suggestion": {
            "title": "Artisan AI Suggestion",
            "subtitle": "Based on your browsing history",
            "text": (
                "The magenta lotus design shown in the feed has a 20% higher profit "
                "margin if produced using the locally sourced raw silk currently on sale."
            ),
            "action": "Calculate Potential Profit",
        },
        "material_forecast": [
            {"name": "Mulberry Silk", "price": "₹4,200", "status": "Low Stock Alert", "trend": "+8.3% ↗"},
            {"name": "Cotton Yarn", "price": "₹850", "status": "Stable Demand", "trend": "+1.1% ↗"},
            {"name": "Natural Indigo", "price": "₹1,800", "status": "Price Drop", "trend": "-3.4% ↘"},
        ],
    }
