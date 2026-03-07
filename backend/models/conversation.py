from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    """Requête de chat envoyée par le frontend."""
    message: str
    language: str = "darija"
    session_id: str
    user_profile: Optional[dict] = None


class ChatResponse(BaseModel):
    """Réponse de chat retournée par l'assistant."""
    response: str
    language_used: str
    session_id: str
    demarche_detected: Optional[str] = None
    checklist: Optional[dict] = None
    next_action: Optional[str] = None
    response_audio_url: Optional[str] = None
