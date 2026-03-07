from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.llm_service import chat_with_mistral
from services.demarche_engine import DemarcheEngine

router = APIRouter()
engine = DemarcheEngine()


class ChatRequest(BaseModel):
    message: str
    language: str = "darija"
    session_id: str
    user_profile: Optional[dict] = None


class ChatResponse(BaseModel):
    response: str
    language_used: str
    session_id: str
    demarche_detected: Optional[str] = None
    checklist: Optional[dict] = None
    next_action: Optional[str] = None
    response_audio_url: Optional[str] = None


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Endpoint principal de chat avec l'assistant Khidmati."""
    result = await chat_with_mistral(
        message=request.message,
        session_id=request.session_id,
        language=request.language,
        user_profile=request.user_profile,
    )
    checklist = None
    if result.get("demarche_detected"):
        checklist = engine.generate_checklist(
            result["demarche_detected"], {}, request.language
        )
    return ChatResponse(
        response=result["response"],
        language_used=result["language_used"],
        session_id=result["session_id"],
        demarche_detected=result.get("demarche_detected"),
        checklist=checklist,
    )
