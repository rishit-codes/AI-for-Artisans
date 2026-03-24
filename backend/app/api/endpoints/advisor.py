import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from groq import AsyncGroq

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

async def stream_groq_response(messages: List[Dict[str, Any]]):
    current_date = "March 16, 2026"
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
    artisan_id: str
):
    """
    Generates a production feed (timeline). 
    Since the service file was deleted, returning a mock feed for now.
    """
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
        },
        {
            "timeLabel": "TOMORROW",
            "nodeColor": "icon-bg-green",
            "type": "production",
            "title": "Silk Weaving",
            "badge": { "label": "High Priority", "variant": "amber" },
            "description": "Begin weaving the red and gold silk sarees. High festive demand expected.",
            "aiAdvice": "Keep silk yarns away from direct heat.",
        }
    ]
