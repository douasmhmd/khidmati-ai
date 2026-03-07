"""
Service ASR (Automatic Speech Recognition) — Transcription audio avec Whisper.
Fallback mock si Whisper non disponible.
"""

import logging
import asyncio
from config import WHISPER_MODEL

logger = logging.getLogger("khidmati.asr")

# Cache du modèle Whisper (chargé une seule fois)
_whisper_model = None

# Mots marqueurs de la Darija marocaine
DARIJA_MARKERS = [
    "واش", "كيفاش", "فين", "آش", "علاش", "بزاف", "مزيان", "خويا", "لبسة",
    "دابا", "بغيت", "ماشي", "كاين", "بلا", "حتى", "فاش", "علا", "ديال",
    "هاد", "بحال", "نعس", "باغي", "شنو", "فين", "علاش", "آش",
]


def _load_whisper_model():
    """Charge le modèle Whisper (avec gestion d'erreur)."""
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model
    try:
        import whisper
        logger.info(f"Chargement du modèle Whisper '{WHISPER_MODEL}'...")
        _whisper_model = whisper.load_model(WHISPER_MODEL)
        logger.info("Modèle Whisper chargé avec succès")
        return _whisper_model
    except Exception as e:
        logger.warning(f"Whisper non disponible: {e}")
        return None


def _detect_darija(text: str, language: str) -> bool:
    """Détecte si le texte transcrit est en Darija marocaine."""
    text_lower = text.lower()
    darija_count = sum(1 for marker in DARIJA_MARKERS if marker in text_lower)
    return darija_count >= 1


def _get_mock_transcription() -> dict:
    """Retourne une transcription mock pour la démo."""
    return {
        "transcription": "بغيت نجدد البطاقة الوطنية ديالي",
        "language_detected": "ar",
        "confidence": 0.85,
        "is_darija": True,
        "_mock": True,
    }


async def _preprocess_audio(file_path: str) -> str:
    """
    Prétraitement audio : conversion en WAV 16kHz mono, limite 60 secondes.
    Retourne le chemin du fichier prétraité.
    """
    try:
        from pydub import AudioSegment
        import tempfile
        import os

        audio = AudioSegment.from_file(file_path)
        # Conversion mono 16kHz
        audio = audio.set_channels(1).set_frame_rate(16000)
        # Limite à 60 secondes
        if len(audio) > 60_000:
            audio = audio[:60_000]

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        audio.export(tmp.name, format="wav")
        tmp.close()
        return tmp.name
    except Exception as e:
        logger.warning(f"Prétraitement audio impossible: {e}")
        return file_path


async def transcribe_audio(audio_file_path: str) -> dict:
    """
    Transcrit un fichier audio en texte.
    Tente Whisper → Mock si indisponible.
    """
    model = _load_whisper_model()

    if model is None:
        logger.info("Whisper indisponible → réponse mock")
        return _get_mock_transcription()

    try:
        # Prétraitement dans un thread séparé (opération bloquante)
        preprocessed_path = await _preprocess_audio(audio_file_path)

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: model.transcribe(
                preprocessed_path,
                language=None,  # Détection automatique
                task="transcribe",
                fp16=False,
            ),
        )

        text = result.get("text", "").strip()
        language = result.get("language", "ar")

        # Nettoyage du fichier prétraité si différent de l'original
        if preprocessed_path != audio_file_path:
            try:
                import os
                os.unlink(preprocessed_path)
            except Exception:
                pass

        if not text:
            return _get_mock_transcription()

        return {
            "transcription": text,
            "language_detected": language,
            "confidence": 0.9,
            "is_darija": _detect_darija(text, language),
            "_mock": False,
        }

    except Exception as e:
        logger.error(f"Erreur Whisper: {e}")
        return _get_mock_transcription()
