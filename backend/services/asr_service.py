"""
Service ASR — Transcription audio Darija/Arabe.
Ordre de priorité :
  1. OpenAI Whisper API (whisper-1) — sans GPU, excellente Darija
  2. HuggingFace Inference API (whisper-large-v3) — fallback gratuit
  3. Whisper local (GPU CUDA requis)
  4. Mock (toujours disponible pour la démo)
"""

import os
import logging
import asyncio
import httpx

from config import WHISPER_MODEL, OPENAI_API_KEY, HF_API_TOKEN, HF_STT_MODEL

logger = logging.getLogger("khidmati.asr")

_whisper_model = None

MOROCCAN_CONTEXT_PROMPT = (
    "الدارجة المغربية. إدارة مغربية. خدمتي. البطاقة الوطنية. "
    "شهادة الميلاد. راميد. تصحيح الإمضاء. المقاطعة. الجماعة."
)

DARIJA_MARKERS = [
    "واش", "كيفاش", "فين", "آش", "علاش", "بزاف", "مزيان", "خويا",
    "دابا", "بغيت", "ماشي", "كاين", "بلا", "حتى", "فاش", "علا", "ديال",
    "هاد", "بحال", "باغي", "شنو",
]


def _detect_darija(text: str) -> bool:
    return sum(1 for m in DARIJA_MARKERS if m in text.lower()) >= 1


def _get_mock_transcription() -> dict:
    return {
        "transcription": "بغيت نجدد البطاقة الوطنية ديالي",
        "language_detected": "ar",
        "confidence": 0.85,
        "is_darija": True,
        "_mock": True,
        "provider": "mock",
    }


# ---------------------------------------------------------------------------
# Provider 1 : OpenAI Whisper API
# ---------------------------------------------------------------------------

async def _call_openai_whisper(audio_path: str, api_key: str) -> str:
    """
    Transcrit via l'API officielle OpenAI Whisper (whisper-1).
    Supporte webm, ogg, wav, mp4, mp3 — excellente précision Darija.
    """
    filename = os.path.basename(audio_path)
    ext = os.path.splitext(filename)[-1].lower() or ".webm"

    mime_map = {
        ".webm": "audio/webm",
        ".wav":  "audio/wav",
        ".ogg":  "audio/ogg",
        ".mp3":  "audio/mpeg",
        ".mp4":  "audio/mp4",
        ".m4a":  "audio/mp4",
    }
    content_type = mime_map.get(ext, "audio/webm")

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={
                "file": (filename, audio_bytes, content_type),
            },
            data={
                "model": "whisper-1",
                "language": "ar",          # Forcer arabe/darija
                "prompt": MOROCCAN_CONTEXT_PROMPT,
            },
        )
        response.raise_for_status()
        return response.json().get("text", "").strip()


# ---------------------------------------------------------------------------
# Provider 2 : HuggingFace Inference API
# ---------------------------------------------------------------------------

async def _call_hf_inference_api(audio_path: str, hf_token: str, model: str) -> str:
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    ext = os.path.splitext(audio_path)[-1].lower()
    mime_map = {".webm": "audio/webm", ".wav": "audio/wav",
                ".ogg": "audio/ogg", ".mp3": "audio/mpeg", ".m4a": "audio/mp4"}
    content_type = mime_map.get(ext, "audio/webm")

    async with httpx.AsyncClient(timeout=90.0) as client:
        for attempt in range(2):
            response = await client.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers={"Authorization": f"Bearer {hf_token}", "Content-Type": content_type},
                content=audio_bytes,
            )
            if response.status_code == 503:
                wait = min(float(response.json().get("estimated_time", 20)), 25)
                logger.info(f"HF model loading, attente {wait}s (tentative {attempt+1}/2)")
                await asyncio.sleep(wait)
                continue
            response.raise_for_status()
            data = response.json()
            if isinstance(data, dict):
                return data.get("text", "")
            if isinstance(data, list) and data:
                item = data[0]
                return item.get("generated_text", item.get("text", ""))
            return ""
    return ""


# ---------------------------------------------------------------------------
# Provider 3 : Whisper local (GPU)
# ---------------------------------------------------------------------------

def _load_whisper_model():
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model
    try:
        import whisper, torch
        if not torch.cuda.is_available():
            return None
        logger.info(f"Chargement Whisper local '{WHISPER_MODEL}'...")
        _whisper_model = whisper.load_model(WHISPER_MODEL, device="cuda")
        return _whisper_model
    except Exception as e:
        logger.warning(f"Whisper local non disponible: {e}")
        return None


async def _preprocess_audio(file_path: str) -> str:
    try:
        from pydub import AudioSegment
        import tempfile
        audio = AudioSegment.from_file(file_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        if len(audio) > 60_000:
            audio = audio[:60_000]
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        audio.export(tmp.name, format="wav")
        tmp.close()
        return tmp.name
    except Exception:
        return file_path


async def _transcribe_local_whisper(audio_path: str) -> str:
    model = _load_whisper_model()
    if model is None:
        raise RuntimeError("Whisper local non disponible")
    preprocessed = await _preprocess_audio(audio_path)
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: model.transcribe(preprocessed, language=None, task="transcribe",
                                  fp16=True, initial_prompt=MOROCCAN_CONTEXT_PROMPT),
    )
    if preprocessed != audio_path:
        try:
            os.unlink(preprocessed)
        except Exception:
            pass
    return result.get("text", "").strip()


# ---------------------------------------------------------------------------
# Point d'entrée principal
# ---------------------------------------------------------------------------

async def transcribe_audio(audio_file_path: str) -> dict:
    """
    Transcrit un fichier audio en Darija/Arabe.
    Priorité : OpenAI Whisper API → HF API → Whisper local → Mock.
    """
    # 1. OpenAI Whisper API (meilleure qualité Darija)
    if OPENAI_API_KEY:
        try:
            logger.info("Transcription via OpenAI Whisper API")
            text = await _call_openai_whisper(audio_file_path, OPENAI_API_KEY)
            if text:
                logger.info(f"OpenAI Whisper OK: {text[:80]}")
                return {
                    "transcription": text,
                    "language_detected": "ar",
                    "confidence": 0.95,
                    "is_darija": _detect_darija(text),
                    "_mock": False,
                    "provider": "openai_whisper",
                }
            logger.warning("OpenAI Whisper retourné texte vide → fallback")
        except Exception as e:
            logger.warning(f"OpenAI Whisper indisponible: {e}")

    # 2. HuggingFace Inference API
    if HF_API_TOKEN:
        try:
            logger.info(f"Transcription via HuggingFace: {HF_STT_MODEL}")
            text = await _call_hf_inference_api(audio_file_path, HF_API_TOKEN, HF_STT_MODEL)
            if text:
                logger.info(f"HF OK: {text[:80]}")
                return {
                    "transcription": text,
                    "language_detected": "ar",
                    "confidence": 0.90,
                    "is_darija": _detect_darija(text),
                    "_mock": False,
                    "provider": "huggingface",
                }
        except Exception as e:
            logger.warning(f"HF indisponible: {e}")

    # 3. Whisper local (GPU)
    try:
        text = await _transcribe_local_whisper(audio_file_path)
        if text:
            return {
                "transcription": text,
                "language_detected": "ar",
                "confidence": 0.90,
                "is_darija": _detect_darija(text),
                "_mock": False,
                "provider": "whisper_local",
            }
    except Exception as e:
        logger.warning(f"Whisper local échec: {e}")

    # 4. Mock
    logger.info("Fallback mock")
    return _get_mock_transcription()


async def transcribe_by_language(audio_file_path: str, lang: str = "darija") -> dict:
    """Point d'entrée unifié STT multilingue."""
    if lang == "amazigh":
        from services.amazigh_service import transcribe_amazigh
        return await transcribe_amazigh(audio_file_path)
    return await transcribe_audio(audio_file_path)
