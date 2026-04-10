import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.material import Material
from app.db.session import get_db
from app.services.festivals import get_days_to_next_festival

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

async def stream_groq_response(messages: List[Dict[str, Any]]):
    current_date = "March 16, 2026"  # Static for demo, could be datetime.now()
    system_prompt = (
        f"Today is {current_date}. "
        "You are a production advisor for Indian artisans. You help with "
        "craft techniques, material selection, production planning, and quality guidance. "
        "Keep answers practical, concise, and relevant to traditional Indian crafts. "
        "Respond exclusively in English. "
        "Use Groq's fast response to give helpful advice."
    )

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    try:
        completion = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
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
async def chat_with_advisor(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    # Build messages log
    messages = []
    for msg in request.conversation_history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": request.message})
    
    return StreamingResponse(
        stream_groq_response(messages),
        media_type="text/event-stream"
    )

@router.get("/feed")
async def get_advisor_feed(
    artisan_id: Optional[str] = None, 
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a dynamic production feed (timeline) via Groq LLM JSON-Mode. 
    It incorporates live materials prices and festival proximities.
    """
    try:
        # 1. Gather Context
        m_result = await db.execute(select(Material))
        materials = m_result.scalars().all()
        
        mat_context = []
        for m in materials:
            mat_context.append(f"{m.commodity_full_name or m.name}: {m.price} (Trend: {m.trend.upper()})")
        mat_str = ", ".join(mat_context) if mat_context else "No active tracking data."
        
        # We can dynamically guess their craft via Artisan mapping, but we default to Textile/Weaver
        craft_type = "textile"
        fest_info = get_days_to_next_festival(craft_type)
        days_to_festival = fest_info["days_away"] if fest_info else 30
        festival_name = fest_info["name"] if fest_info else "Upcoming Festival"
        
        # 1.5. Gather Live Weather (Open-Meteo for Jaipar example)
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

        import datetime
        current_month = datetime.datetime.now().strftime("%B")

        # 2. Build Intelligent Prompt
        prompt = f"""You are an expert AI logistics and production advisor for a rural Indian {craft_type} artisan.
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
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        
        response_text = completion.choices[0].message.content
        data = json.loads(response_text)
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
