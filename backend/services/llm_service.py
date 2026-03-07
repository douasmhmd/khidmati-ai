"""
Service LLM — Gestion des conversations avec Mistral API, Ollama ou Mock.
Ordre de priorité : Mistral API → Ollama → Mock

Architecture mémoire :
  conversation_memory[session_id] = [
      {"role": "system",    "content": "..."},   ← index 0, toujours présent
      {"role": "user",      "content": "..."},
      {"role": "assistant", "content": "..."},
      ...
  ]
"""

import logging
import json
import re
from typing import Optional
import httpx
from config import MISTRAL_API_KEY, OLLAMA_URL

logger = logging.getLogger("khidmati.llm")

# --- Mémoire de conversation par session_id ----------------------------
# Chaque valeur est le tableau COMPLET des messages (system + historique).
conversation_memory: dict[str, list] = {}

# --- System prompts par langue -----------------------------------------
SYSTEM_PROMPTS = {
    "darija": (
        "أنت 'خدمتي'، مساعد إداري مغربي فعّال ومتخصص في خدمات الإدارة العمومية.\n\n"
        "قواعد صارمة لازم تتبعها في كل رسالة:\n"
        "1. تكلم دائماً بالدارجة المغربية الواضحة والمختصرة — ماشي عربية فصحى\n"
        "2. رشد المواطن خطوة بخطوة — ما تعطيش كل المعلومات دفعة وحدة\n"
        "3. سول سؤال واحد بالزاز في كل رد — ما تكثرش الأسئلة أبداً\n"
        "4. اعتمد على المتطلبات الرسمية للإدارة المغربية (الوثائق المطلوبة، المكاتب، الأوقات)\n"
        "5. إلا المعلومة ناقصة، سول على التفصيل الناقص مباشرة باش تكمل للخطوة الجاية\n\n"
        "المساعي الرئيسية: تجديد البطاقة الوطنية، شهادة الميلاد، التسجيل في راميد، تصحيح الإمضاء.\n"
        "ما تنساش: ردودك قصيرة، مباشرة، وسؤال واحد فقط."
    ),
    "arabic": (
        "أنت 'خدمتي'، مساعد إداري مغربي فعّال. "
        "اتبع هذه القواعد: تكلم بعربية بسيطة وواضحة، وجّه المواطن خطوة بخطوة، "
        "اسأل سؤالاً واحداً فقط في كل رد، اعتمد على المتطلبات الرسمية للإدارة المغربية، "
        "واطلب المعلومة الناقصة فوراً إذا لزم الأمر للانتقال للخطوة التالية."
    ),
    "french": (
        "Tu es 'Khidmati AI', assistant administratif marocain efficace. "
        "Règles strictes : parle uniquement en français simple (niveau A1-A2), "
        "guide l'utilisateur étape par étape, pose UNE SEULE question par réponse, "
        "base-toi sur les exigences officielles de l'administration marocaine, "
        "et demande immédiatement le détail manquant si l'information est incomplète."
    ),
    "amazigh": (
        "Ntta d 'Khidmati', amddakkal n tɣawsiwin n tmazirt n Lmuɣrib. "
        "Ssiwel s tmaziɣt tuţţrimt (Tamaziɣt n Lmuɣrib). "
        "Ixef-ik: Aglam n yiwen n usteqsi deg kra n tiririt. "
        "Aglam amatu: asikel n tkarḍa, tasɣunt n tlallit, RAMED, tasɣunt n tɣuri. "
        "Ma ulac talɣut, suter-itt s tazwara. Tiririt-ik tili d tamẓaɣt, yiwen n usteqsi kan.\n\n"
        "Si l'utilisateur écrit en arabe ou français, réponds en tamazight simple et clair. "
        "Guide-le étape par étape pour ses démarches administratives marocaines."
    ),
}

STRICT_OUTPUT_INSTRUCTIONS = (
    "\n\nFormat de sortie obligatoire:\n"
    "Réponds strictement en JSON valide sur une seule ligne, sans markdown, sans texte autour.\n"
    "Schéma exact: {\"response\":\"...\"}\n"
    "Contraintes: réponse courte (max 2 phrases), claire, une seule question à la fois."
)

KEYWORDS_DEMARCHE = {
    "renouvellement_cin": [
        "بطاقة", "سيبيه", "CIN", "carte", "nationale", "تجديد", "renouvellement", "هوية",
    ],
    "acte_naissance": ["ميلاد", "شهادة", "naissance", "acte", "extrait", "عقد"],
    "inscription_ramed": ["راميد", "ramed", "RAMED", "صحة", "مجانية", "assurance"],
    "legalisation": ["إمضاء", "تصحيح", "légalisation", "signature", "توقيع"],
}

MOCK_LLM_RESPONSES = {
    "بطاقة": "واش البطاقة ديالك سالت ولا خسرتيها؟",
    "سيبيه": "واش البطاقة ديالك سالت ولا خسرتيها؟",
    "سالت": "مزيان، خاصك تجيب: البطاقة القديمة، صورة شخصية، وفاتورة الضوء. فين ساكن دابا؟",
    "خسرت": "خاصك أولاً تمشي للشرطة وتصرح بالضياع، بعدها تجيب التصريح معك.",
    "ميلاد": "خاصك غير البطاقة الوطنية! المكتب كيعطيك الشهادة فنفس النهار، مجانية.",
    "راميد": "راميد مجاني! خاصك: بطائق الأسرة + شهادة عدم الدخل + فاتورة الضوء. كم شخص فدارك؟",
    "ramed": "Le RAMED est gratuit ! Documents : CIN famille + attestation non-revenus + justificatif domicile.",
    "إمضاء": "تصحيح الإمضاء سهل! جيب البطاقة والوثيقة، 15 درهم، فنفس النهار.",
    "bonjour": "Bonjour ! Je suis Khidmati AI. Quelle démarche souhaitez-vous effectuer ?",
    "السلام": "وعليكم السلام! أنا خدمتي، غانعاونك مع الإدارة. قولي شنو خاصك.",
    "default": "فهمت! غانعاونك. قولي أكثر شنو خاصك بالضبط؟",
}


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------

def _build_system_prompt(language: str) -> str:
    base = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS["darija"])
    return f"{base}{STRICT_OUTPUT_INSTRUCTIONS}"


def _make_system_message(language: str) -> dict:
    return {"role": "system", "content": _build_system_prompt(language)}


def detect_language(text: str) -> str:
    french_words = {"bonjour", "merci", "aide", "comment", "je", "vous", "carte", "acte"}
    if set(text.lower().split()) & french_words:
        return "fr"
    if any("\u0600" <= c <= "\u06ff" for c in text):
        return "darija"
    return "fr"


def _identify_demarche(message: str) -> Optional[str]:
    msg_lower = message.lower()
    for demarche_id, keywords in KEYWORDS_DEMARCHE.items():
        if any(kw.lower() in msg_lower for kw in keywords):
            return demarche_id
    return None


def _get_mock_response(message: str) -> str:
    for keyword, response in MOCK_LLM_RESPONSES.items():
        if keyword != "default" and keyword.lower() in message.lower():
            return response
    return MOCK_LLM_RESPONSES["default"]


def _extract_response_text(raw_content: str) -> str:
    if not raw_content:
        return ""
    content = raw_content.strip()
    try:
        parsed = json.loads(content)
        r = parsed.get("response", "")
        if isinstance(r, str) and r.strip():
            return r.strip()
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", content)
    if match:
        try:
            parsed = json.loads(match.group(0))
            r = parsed.get("response", "")
            if isinstance(r, str) and r.strip():
                return r.strip()
        except Exception:
            pass
    sentences = re.split(r"(?<=[.!؟?])\s+", content)
    trimmed = " ".join(sentences[:2]).strip()
    return trimmed[:280].strip() if trimmed else content[:280].strip()


# -----------------------------------------------------------------------
# LLM providers — reçoivent le tableau COMPLET (system + historique + user)
# -----------------------------------------------------------------------

async def _call_mistral_api(messages: list, api_key: str) -> str:
    """Envoie le tableau complet des messages à l'API Mistral."""
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
        return _extract_response_text(data["choices"][0]["message"]["content"])


async def _call_ollama(messages: list, ollama_url: str) -> str:
    """Envoie le tableau complet des messages à Ollama."""
    async with httpx.AsyncClient(timeout=8.0) as client:
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
        return _extract_response_text(data["message"]["content"])


# -----------------------------------------------------------------------
# Fonction principale
# -----------------------------------------------------------------------

async def chat_with_mistral(
    message: str,
    session_id: str,
    language: str = "darija",
    user_profile: Optional[dict] = None,
    external_history: Optional[list] = None,
) -> dict:
    """
    Gère la conversation en respectant les 6 règles de gestion d'état :

    1. Tableau persistant par session_id
    2. Initialisation avec system prompt si session nouvelle
    3. Append user message AVANT l'appel API
    4. Envoie le tableau COMPLET à Mistral
    5. Append assistant response APRÈS l'appel API
    6. reset_session() disponible pour "Nouveau Chat"
    """
    if language == "auto":
        language = detect_language(message)

    # [RÈGLE 2] Initialiser la session avec le system prompt si elle n'existe pas
    if session_id not in conversation_memory:
        conversation_memory[session_id] = [_make_system_message(language)]
        logger.info(f"[{session_id}] Nouvelle session initialisée avec system prompt")

    history = conversation_memory[session_id]

    # [RÈGLE 3] Append user message AVANT l'appel API
    history.append({"role": "user", "content": message})

    demarche_detected = _identify_demarche(message)
    response_text = None
    provider_used = "mock"

    # [RÈGLE 4] Envoyer le tableau COMPLET (system + historique + user)
    if MISTRAL_API_KEY:
        try:
            response_text = await _call_mistral_api(history, MISTRAL_API_KEY)
            provider_used = "mistral_api"
            logger.info(f"[{session_id}] Réponse Mistral API ({len(history)} messages)")
        except Exception as e:
            logger.warning(f"[{session_id}] Mistral indisponible: {e}")

    if response_text is None:
        try:
            response_text = await _call_ollama(history, OLLAMA_URL)
            provider_used = "ollama"
            logger.info(f"[{session_id}] Réponse Ollama")
        except Exception as e:
            logger.warning(f"[{session_id}] Ollama indisponible: {e}")

    if response_text is None:
        response_text = _get_mock_response(message)
        provider_used = "mock"
        logger.info(f"[{session_id}] Réponse Mock")

    # [RÈGLE 5] Append assistant response APRÈS l'appel API
    history.append({"role": "assistant", "content": response_text})

    # Garder system prompt + 40 derniers messages (20 tours)
    if len(history) > 41:
        conversation_memory[session_id] = [history[0]] + history[-40:]

    return {
        "response": response_text,
        "language_used": language,
        "session_id": session_id,
        "demarche_detected": demarche_detected,
        "provider": provider_used,
    }


# -----------------------------------------------------------------------
# [RÈGLE 6] Reset — efface et réinitialise au system prompt
# -----------------------------------------------------------------------

def reset_session(session_id: str, language: str = "darija") -> None:
    """Vide le tableau et le réinitialise avec uniquement le system prompt."""
    conversation_memory[session_id] = [_make_system_message(language)]
    logger.info(f"[{session_id}] Session réinitialisée (nouveau chat)")


def clear_session(session_id: str) -> None:
    """Supprime complètement une session de la mémoire."""
    conversation_memory.pop(session_id, None)
    logger.info(f"[{session_id}] Session supprimée")
