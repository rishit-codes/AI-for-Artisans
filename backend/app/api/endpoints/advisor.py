import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []

async def stream_claude_response(messages: List[Dict[str, Any]]):
    system_prompt = (
        "You are a production advisor for Indian artisans. You help with "
        "craft techniques, material selection, production planning, and quality guidance. "
        "Keep answers practical, concise, and relevant to traditional Indian crafts. "
        "Respond in the language the user writes in (Hindi or English)."
    )

    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    
    payload = {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": messages,
        "stream": True,
    }

    async with httpx.AsyncClient() as client:
        try:
            async with client.stream(
                "POST", "https://api.anthropic.com/v1/messages", headers=headers, json=payload
            ) as response:
                if response.status_code != 200:
                    text_err = await response.aread()
                    raise HTTPException(
                        status_code=502,
                        detail="Failed to communicate with Advisor API."
                    )
                
                async for chunk in response.aiter_lines():
                    if chunk.startswith("data: "):
                        data_str = chunk[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if data.get("type") == "content_block_delta":
                                delta = data.get("delta", {})
                                if delta.get("type") == "text_delta":
                                    yield delta.get("text", "")
                        except json.JSONDecodeError:
                            continue
        except httpx.RequestError:
            raise HTTPException(
                status_code=502,
                detail="Failed to connect to Advisor service. Please try again later."
            )

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
        stream_claude_response(messages),
        media_type="text/event-stream"
    )
