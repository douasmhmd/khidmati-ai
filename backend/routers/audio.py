"""
Router Audio — Transcription STT multilingue (Darija/Tamazight) + TTS.
"""
import os
import shutil
import tempfile
import logging

from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Query, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.asr_service import transcribe_by_language
from services.tts_service import text_to_speech

logger = logging.getLogger("khidmati.audio_router")

router = APIRouter()


@router.post("/process")
async def process_audio(
    file: UploadFile = File(...),
    lang: str = Query("darija", description="Langue: 'darija' (Whisper) ou 'amazigh' (Odyssey)"),
):
    """
    Reçoit un fichier audio (webm/ogg/wav), le transcrit selon la langue.
    - darija  → modèle Whisper (GPU si disponible, sinon CPU/mock)
    - amazigh → modèle Odyssey (si disponible, sinon mock Tamazight)
    Retourne: { transcription, language_detected, confidence, _mock }
    """
    # Sauvegarder le fichier uploadé dans un fichier temporaire
    suffix = os.path.splitext(file.filename or "audio.webm")[-1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        logger.info(f"Traitement audio reçu: {file.filename} | lang={lang} | taille={os.path.getsize(tmp_path)} bytes")
        result = await transcribe_by_language(tmp_path, lang=lang)
        logger.info(f"Transcription réussie: {result.get('transcription', '')[:80]}")
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la transcription audio: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur transcription: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


class TTSRequest(BaseModel):
    text: str
    lang: str = "ar"


@router.post("/tts")
async def tts_endpoint(req: TTSRequest, background_tasks: BackgroundTasks):
    """
    Synthèse vocale : texte → fichier MP3 via gTTS.
    Langue 'ar' pour Darija/Arabe, 'fr' pour Français.
    """
    audio_path = await text_to_speech(req.text, req.lang)
    if not audio_path:
        raise HTTPException(status_code=503, detail="TTS non disponible — gTTS introuvable ou erreur réseau")
    background_tasks.add_task(os.unlink, audio_path)
    return FileResponse(audio_path, media_type="audio/mpeg", filename="response.mp3")