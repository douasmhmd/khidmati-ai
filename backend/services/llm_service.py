"""
Service LLM — Gestion des conversations avec Mistral API, Ollama ou Mock.
Ordre de priorité : Mistral API → Ollama → Mock
"""

import logging
from typing import Optional
import httpx
from config import MISTRAL_API_KEY, OLLAMA_URL

logger = logging.getLogger("khidmati.llm")

# Mémoire de conversation par session (max 10 tours)
conversation_memory: dict[str, list] = {}

# Prompts système par langue
SYSTEM_PROMPTS = {
    "darija": (
        "أنت 'خدمتي'، مساعد ذكي مغربي يساعد المواطنين في إنجاز مساعيهم الإدارية.\n\n"
        "قواعد أساسية:\n"
        "1. تكلم دائماً بالدارجة المغربية البسيطة، ما تستعملش كلمات صعبة\n"
        "2. كون مختصر - جاوب بجملة أو جملتين بالزاز\n"
        "3. سول سؤال واحد في كل مرة، ماشي أسئلة كثيرة\n"
        "4. إلا ما فهمتيش، اطلب التوضيح بطريقة بسيطة\n"
        "5. ما تطلبش معلومات زادة على اللي خاصك\n\n"
        "المساعي: تجديد البطاقة الوطنية، شهادة الميلاد، التسجيل في راميد، تصحيح الإمضاء.\n\n"
        "ما تنساش: هاد الشخص ممكن ما يعرفش يقرا، فاستعمل كلمات بسيطة جداً."
    ),
    "arabic": (
        "أنت 'خدمتي'، مساعد ذكي يساعد المواطنين المغاربة في إنجاز إجراءاتهم الإدارية. "
        "استخدم اللغة العربية البسيطة والواضحة. اسأل سؤالاً واحداً في كل مرة."
    ),
    "french": (
        "Tu es 'Khidmati AI', un assistant intelligent qui aide les citoyens marocains "
        "dans leurs démarches administratives. Utilise un français très simple (niveau A1-A2). "
        "Pose une seule question à la fois. Sois bref et clair."
    ),
}

# Mots-clés pour identifier la démarche
KEYWORDS_DEMARCHE = {
    "renouvellement_cin": [
        "بطاقة", "سيبيه", "CIN", "carte", "nationale", "تجديد", "renouvellement",
        "هوية", "identité",
    ],
    "acte_naissance": [
        "ميلاد", "شهادة", "naissance", "acte", "extrait", "عقد",
    ],
    "inscription_ramed": [
        "راميد", "ramed", "RAMED", "صحة", "مجانية", "assurance", "santé",
    ],
    "legalisation": [
        "إمضاء", "تصحيح", "légalisation", "signature", "legalisation", "توقيع",
    ],
}

# Réponses mock par mot-clé (utilisées quand LLM non disponible)
MOCK_LLM_RESPONSES = {
    "بطاقة": "واش البطاقة ديالك سالت ولا خسرتيها؟",
    "سيبيه": "واش البطاقة ديالك سالت ولا خسرتيها؟",
    "سالت": "مزيان، خاصك تجيب: البطاقة القديمة، صورة شخصية، وفاتورة الضوء. فين ساكن دابا؟",
    "خسرت": "خاصك أولاً تمشي للشرطة وتصرح بالضياع، بعدها تجيب التصريح معك.",
    "ميلاد": "خاصك غير البطاقة الوطنية! المكتب كيعطيك الشهادة فنفس النهار، مجانية 🆓",
    "راميد": "راميد مجاني! خاصك: بطائق الأسرة + شهادة عدم الدخل + فاتورة الضوء. كم شخص فدارك؟",
    "ramed": "Le RAMED est gratuit ! Documents : CIN famille + attestation non-revenus + justificatif domicile.",
    "إمضاء": "تصحيح الإمضاء سهل! جيب البطاقة والوثيقة، 15 درهم، فنفس النهار 💰",
    "bonjour": "Bonjour ! Je suis Khidmati AI. Quelle démarche souhaitez-vous effectuer ?",
    "السلام": "وعليكم السلام! أنا خدمتي، غانعاونك مع الإدارة. قولي شنو خاصك 😊",
    "default": "فهمت! غانعاونك. قولي أكثر شنو خاصك بالضبط؟",
}


def detect_language(text: str) -> str:
    """Détecte la langue du texte : darija, ar ou fr."""
    # Mots français courants
    french_words = {"bonjour", "merci", "aide", "comment", "je", "vous", "carte", "acte"}
    words_lower = set(text.lower().split())
    if words_lower & french_words:
        return "fr"
    # Caractères arabes → darija par défaut
    if any("\u0600" <= c <= "\u06ff" for c in text):
        return "darija"
    return "fr"


def _identify_demarche(message: str) -> Optional[str]:
    """Identifie la démarche administrative mentionnée dans le message."""
    message_lower = message.lower()
    for demarche_id, keywords in KEYWORDS_DEMARCHE.items():
        for keyword in keywords:
            if keyword.lower() in message_lower:
                return demarche_id
    return None


def _get_mock_response(message: str) -> str:
    """Retourne une réponse mock basée sur les mots-clés du message."""
    for keyword, response in MOCK_LLM_RESPONSES.items():
        if keyword != "default" and keyword.lower() in message.lower():
            return response
    return MOCK_LLM_RESPONSES["default"]


async def _call_mistral_api(
    message: str, history: list, language: str, api_key: str
) -> str:
    """Appelle l'API Mistral pour générer une réponse."""
    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["darija"])
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mistral-small-latest",
                "messages": messages,
                "max_tokens": 256,
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_ollama(
    message: str, history: list, language: str, ollama_url: str
) -> str:
    """Appelle Ollama (fallback local) pour générer une réponse."""
    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["darija"])
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{ollama_url}/api/chat",
            json={
                "model": "mistral:7b-instruct",
                "messages": messages,
                "stream": False,
                "options": {"num_predict": 256},
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]


async def chat_with_mistral(
    message: str,
    session_id: str,
    language: str = "darija",
    user_profile: Optional[dict] = None,
) -> dict:
    """
    Gère la conversation avec le LLM.
    Tente Mistral API → Ollama → Mock en cas d'échec.
    """
    # Initialiser la mémoire de session
    if session_id not in conversation_memory:
        conversation_memory[session_id] = []

    history = conversation_memory[session_id]

    # Détection automatique de la langue si nécessaire
    if language == "auto":
        language = detect_language(message)

    # Identification de la démarche
    demarche_detected = _identify_demarche(message)

    response_text = None
    provider_used = "mock"

    # 1. Essai Mistral API
    if MISTRAL_API_KEY:
        try:
            response_text = await _call_mistral_api(message, history, language, MISTRAL_API_KEY)
            provider_used = "mistral_api"
            logger.info(f"[{session_id}] Réponse via Mistral API")
        except Exception as e:
            logger.warning(f"[{session_id}] Mistral API indisponible: {e}")

    # 2. Fallback Ollama
    if response_text is None:
        try:
            response_text = await _call_ollama(message, history, language, OLLAMA_URL)
            provider_used = "ollama"
            logger.info(f"[{session_id}] Réponse via Ollama")
        except Exception as e:
            logger.warning(f"[{session_id}] Ollama indisponible: {e}")

    # 3. Fallback Mock (toujours disponible)
    if response_text is None:
        response_text = _get_mock_response(message)
        provider_used = "mock"
        logger.info(f"[{session_id}] Réponse via Mock")

    # Mise à jour de la mémoire de conversation (max 10 tours)
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": response_text})
    if len(history) > 20:  # 10 tours × 2 messages
        conversation_memory[session_id] = history[-20:]

    return {
        "response": response_text,
        "language_used": language,
        "session_id": session_id,
        "demarche_detected": demarche_detected,
        "provider": provider_used,
    }


def clear_session(session_id: str) -> None:
    """Efface la mémoire de conversation d'une session."""
    if session_id in conversation_memory:
        del conversation_memory[session_id]
        logger.info(f"Session {session_id} effacée")
