"""
Service TTS (Text-to-Speech) multilingue.
- Darija/Arabe : gTTS (lang=ar) — très bonne qualité
- Amazigh/Tamazight : HuggingFace facebook/mms-tts-ber → fallback gTTS fr
- Français : gTTS (lang=fr)
"""

import asyncio
import logging
import os
import tempfile
from typing import Optional

import httpx

logger = logging.getLogger("khidmati.tts")

# Mapping langue → code gTTS
_GTTS_LANG = {
    "darija": "ar",
    "arabic": "ar",
    "ar": "ar",
    "french": "fr",
    "fr": "fr",
    "amazigh": "fr",   # fallback gTTS si HF échoue
    "ber": "fr",
}

# Modèle HuggingFace pour la TTS Amazigh (Tamazight du Maroc)
_HF_AMAZIGH_TTS_MODEL = "facebook/mms-tts-ber"


async def _tts_amazigh_hf(text: str) -> Optional[str]:
    """Génère audio Amazigh via HuggingFace Inference API (facebook/mms-tts-ber)."""
    hf_token = os.getenv("HF_API_TOKEN", "")
    if not hf_token:
        return None
    try:
        headers = {"Authorization": f"Bearer {hf_token}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                f"https://api-inference.huggingface.co/models/{_HF_AMAZIGH_TTS_MODEL}",
                headers=headers,
                json={"inputs": text},
            )
            if res.status_code == 503:
                # Modèle en cours de chargement — attendre et réessayer une fois
                wait = min(float(res.json().get("estimated_time", 15)), 20)
                logger.info(f"HF TTS Amazigh loading, attente {wait}s")
                await asyncio.sleep(wait)
                res = await client.post(
                    f"https://api-inference.huggingface.co/models/{_HF_AMAZIGH_TTS_MODEL}",
                    headers=headers,
                    json={"inputs": text},
                )
            res.raise_for_status()
            # La réponse est le fichier audio brut (flac/wav)
            audio_bytes = res.content
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".flac")
            tmp.write(audio_bytes)
            tmp.close()
            logger.info(f"HF TTS Amazigh OK: {tmp.name}")
            return tmp.name
    except Exception as e:
        logger.warning(f"HF TTS Amazigh échoué: {e}")
        return None


async def text_to_speech(text: str, language: str = "ar") -> Optional[str]:
    """
    Convertit le texte en audio.
    - Amazigh : HuggingFace MMS-TTS-BER → fallback gTTS fr
    - Darija/Arabe : gTTS ar
    - Français : gTTS fr
    Retourne le chemin du fichier audio temporaire (à supprimer par l'appelant).
    """
    lang_key = language.lower()

    # Amazigh : essayer HuggingFace en priorité
    if lang_key in ("amazigh", "ber", "tzm"):
        hf_path = await _tts_amazigh_hf(text)
        if hf_path:
            return hf_path
        # Fallback : lire en français (les mots Tifinagh ne sont pas prononçables en ar)
        logger.info("Fallback gTTS fr pour Amazigh")
        lang_key = "fr"

    # Darija / Arabe / Français : gTTS
    try:
        from gtts import gTTS

        gtts_lang = _GTTS_LANG.get(lang_key, "ar")
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        tmp_path = tmp.name
        tmp.close()

        loop = asyncio.get_event_loop()

        def _generate():
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            tts.save(tmp_path)

        await loop.run_in_executor(None, _generate)
        logger.info(f"gTTS ({gtts_lang}) OK: {tmp_path}")
        return tmp_path

    except ImportError:
        logger.warning("gTTS non installé")
        return None
    except Exception as e:
        logger.error(f"Erreur gTTS: {e}")
        return None
