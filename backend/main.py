import time
import logging
from typing import Optional
import tempfile
import os
import shutil
from fastapi import FastAPI, Request, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from routers import chat, audio, document, demarches, watiqati
from services.llm_service import chat_with_mistral
from services.asr_service import transcribe_audio, transcribe_by_language
from services.ocr_service import extract_document_data

# Configuration du logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s — %(levelname)s — %(message)s")
logger = logging.getLogger("khidmati")

app = FastAPI(
    title="Khidmati AI",
    description="Assistant IA pour les démarches administratives marocaines",
    version="1.0.0-mvp",
)

# CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware qui log chaque requête entrante et sortante."""
    start_time = time.time()
    logger.info(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    duration = round((time.time() - start_time) * 1000, 2)
    logger.info(f"← {request.method} {request.url.path} [{response.status_code}] {duration}ms")
    return response


# Inclusion des routers
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(audio.router, prefix="/audio", tags=["Audio"])
app.include_router(document.router, prefix="/document", tags=["Document"])
app.include_router(demarches.router, prefix="/demarches", tags=["Démarches"])
app.include_router(watiqati.router, prefix="/api/watiqati", tags=["Watiqati"])


@app.get("/health")
async def health():
    """Endpoint de vérification de santé du service."""
    return {"status": "ok", "service": "Khidmati AI", "version": "1.0.0-mvp"}


@app.get("/")
async def root():
    """Page d'accueil de l'API."""
    return {
        "message": "مرحبا بكم في خدمتي — Bienvenue sur Khidmati AI",
        "docs": "/docs",
        "health": "/health",
    }


class LegacyChatRequest(BaseModel):
    text: str
    lang: str = "darija"
    session_id: Optional[str] = None


class ResetRequest(BaseModel):
    session_id: str
    lang: str = "darija"


@app.post("/api/chat")
async def legacy_chat_endpoint(req: LegacyChatRequest):
    """
    Endpoint principal du chat.
    Le backend gère intégralement l'historique en mémoire (session_id).
    """
    result = await chat_with_mistral(
        message=req.text,
        session_id=req.session_id or "default_session",
        language=req.lang,
    )
    return {
        "response": result["response"],
        "provider": result.get("provider", "unknown"),
        "demarche_detected": result.get("demarche_detected"),
    }


@app.post("/api/chat/reset")
async def reset_chat_session(req: ResetRequest):
    """
    Efface l'historique de la session et réinitialise avec le system prompt.
    Appelé par le bouton 'Nouveau Chat' du frontend.
    """
    from services.llm_service import reset_session
    reset_session(req.session_id, req.lang)
    return {"status": "reset", "session_id": req.session_id}


@app.post("/api/audio/process")
async def legacy_audio_process(
    file: UploadFile = File(...),
    lang: str = Query("darija"),
):
    """Compatibilité frontend: traite un audio uploadé et retourne la transcription."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        result = await transcribe_by_language(tmp_path, lang=lang)
        result["lang_requested"] = lang
        return result
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/api/document/scan-cin")
async def legacy_scan_cin(file: UploadFile = File(...)):
    """Compatibilité frontend: extrait les champs principaux de la CIN."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    try:
        result = await extract_document_data(tmp_path, "cin")
        extracted = result.get("extracted_data", {})
        return {
            "data": {
                "nom": extracted.get("nom", ""),
                "prenom": extracted.get("prenom", ""),
                "cin": extracted.get("numero_cin", ""),
            },
            "confidence": result.get("confidence"),
            "_mock": result.get("_mock", False),
        }
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


