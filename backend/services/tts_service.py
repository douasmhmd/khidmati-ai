"""
Service TTS (Text-to-Speech) — Synthèse vocale avec gTTS.
Fallback : retourne None si gTTS non disponible.
"""

import logging
import tempfile
import os
from typing import Optional

logger = logging.getLogger("khidmati.tts")


async def text_to_speech(text: str, language: str = "ar") -> Optional[str]:
    """
    Convertit le texte en audio via gTTS.
    Retourne le chemin vers le fichier audio ou None en cas d'échec.
    Note: Le fichier temporaire créé est sous la responsabilité de l'appelant pour suppression.
    """
    try:
        from gtts import gTTS
        import asyncio

        # Mapping langue → code gTTS
        lang_map = {
            "darija": "ar",
            "arabic": "ar",
            "ar": "ar",
            "french": "fr",
            "fr": "fr",
        }
        gtts_lang = lang_map.get(language, "ar")

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        tmp_path = tmp.name
        tmp.close()

        loop = asyncio.get_event_loop()

        def _generate():
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            tts.save(tmp_path)

        await loop.run_in_executor(None, _generate)
        logger.info(f"Audio généré: {tmp_path}")
        return tmp_path

    except ImportError:
        logger.warning("gTTS non installé → pas d'audio")
        return None
    except Exception as e:
        logger.error(f"Erreur TTS: {e}")
        return None
