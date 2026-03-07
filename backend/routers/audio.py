from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import tempfile
import os
import shutil
from services.asr_service import transcribe_audio

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("auto"),
):
    """Transcrit un fichier audio en texte (Darija/Arabe/Français)."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name
    try:
        result = await transcribe_audio(tmp_path)
        return result
    finally:
        os.unlink(tmp_path)
