"""
Service Amazigh (Tamazight) — Transcription STT via modèle Odyssey.
Tente un appel HTTP à un serveur Odyssey local → Fallback mock si indisponible.

Architecture prévue :
  Odyssey API locale sur http://localhost:8001/transcribe (POST multipart/form-data)
  Réponse attendue : { "text": "..." }
"""
import logging
import os

import httpx

logger = logging.getLogger("khidmati.amazigh")

# URL du serveur Odyssey (configurable via variable d'environnement)
ODYSSEY_URL = os.getenv("ODYSSEY_URL", "http://localhost:8001")

# Réponses mock en Tamazight pour la démo
MOCK_AMAZIGH_RESPONSES = [
    "ⵔⵉⵖ ⴰⴷ ⵙⵙⵉⵡⴹⵖ ⵜⴰⵔⴳⵉⵡⵜ ⵏⵓ",        # "Je veux renouveler ma carte"
    "ⵎⴰⵎⴽ ⴰⴷ ⴰⵡⵏⴽ ⵖ ⵓⵙⵍⴽⵉⵏ ⴰ?",        # "Comment puis-je continuer?"
    "ⴰⵔ ⵖⵔⵉⵖ ⵜⴰⵔⵙⵉⵜ ⵏ ⵓⵣⵎⵣ ⵏ ⵓⵎⵣⵉⵔⴰⵢ", # "Je cherche l'acte de naissance"
]
_mock_idx = 0


def _get_mock_amazigh() -> dict:
    """Retourne une transcription mock Tamazight (rotation)."""
    global _mock_idx
    text = MOCK_AMAZIGH_RESPONSES[_mock_idx % len(MOCK_AMAZIGH_RESPONSES)]
    _mock_idx += 1
    return {
        "transcription": text,
        "language_detected": "ber",
        "confidence": 0.80,
        "is_darija": False,
        "_mock": True,
    }


async def transcribe_amazigh(audio_path: str) -> dict:
    """
    Transcrit un fichier audio en Tamazight via le modèle Odyssey.
    Fallback automatique sur le mock si Odyssey n'est pas disponible.

    Args:
        audio_path: Chemin absolu vers le fichier audio (wav/webm).

    Returns:
        dict avec clés: transcription, language_detected, confidence, is_darija, _mock
    """
    try:
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()

        filename = os.path.basename(audio_path)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ODYSSEY_URL}/transcribe",
                files={"audio": (filename, audio_bytes, "audio/wav")},
            )
            response.raise_for_status()
            data = response.json()

        text = data.get("text", "").strip()
        if not text:
            logger.warning("Odyssey a retourné un texte vide → mock")
            return _get_mock_amazigh()

        logger.info(f"Odyssey transcription réussie: {text[:60]}")
        return {
            "transcription": text,
            "language_detected": "ber",
            "confidence": data.get("confidence", 0.85),
            "is_darija": False,
            "_mock": False,
        }

    except httpx.ConnectError:
        logger.info("Odyssey non disponible (ConnectError) → mock Tamazight")
        return _get_mock_amazigh()
    except httpx.TimeoutException:
        logger.warning("Odyssey timeout → mock Tamazight")
        return _get_mock_amazigh()
    except Exception as e:
        logger.error(f"Erreur Odyssey: {e} → mock Tamazight")
        return _get_mock_amazigh()
