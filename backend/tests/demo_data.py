"""
Données de démo et scénarios de test pour Khidmati AI.
Utilisation: python demo_data.py
"""

import asyncio
import sys
import os

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Scénarios de démo complets

SCENARIO_1 = {
    "nom": "Mohammed — Renouvellement CIN",
    "language": "darija",
    "messages": [
        "السلام عليكم",
        "بغيت نجدد البطاقة الوطنية ديالي",
        "سالت عندي",
        "ساكن فالرباط حي الرياض",
    ],
}

SCENARIO_2 = {
    "nom": "Fatima — Acte de naissance",
    "language": "darija",
    "messages": [
        "السلام عليكم",
        "خاصني شهادة الميلاد",
        "تولدت فسلا",
        "شكراً بزاف",
    ],
}

SCENARIO_3 = {
    "nom": "Hassan — Inscription RAMED",
    "language": "darija",
    "messages": [
        "السلام",
        "بغيت نسجل في راميد",
        "عندي 5 أشخاص فدار",
        "ساكن فالرباط حي تقدوم",
    ],
}

# Réponses mock par mot-clé
MOCK_LLM_RESPONSES = {
    "بطاقة": "واش البطاقة ديالك سالت ولا خسرتيها؟",
    "سيبيه": "واش البطاقة ديالك سالت ولا خسرتيها؟",
    "سالت": "مزيان، خاصك تجيب: البطاقة القديمة، صورة شخصية، وفاتورة الضوء. فين ساكن دابا؟",
    "خسرت": "خاصك أولاً تمشي للشرطة وتصرح بالضياع، بعدها تجيب التصريح معك.",
    "ميلاد": "خاصك غير البطاقة الوطنية! المكتب كيعطيك الشهادة فنفس النهار، مجانية 🆓",
    "راميد": "راميد مجاني! خاصك: بطائق الأسرة + شهادة عدم الدخل + فاتورة الضوء. كم شخص فدارك؟",
    "إمضاء": "تصحيح الإمضاء سهل! جيب البطاقة والوثيقة، 15 درهم، فنفس النهار 💰",
    "السلام": "وعليكم السلام! أنا خدمتي، غانعاونك مع الإدارة. قولي شنو خاصك 😊",
    "شكراً": "بلا جميل! أنا هنا متى حاجتك 😊",
    "default": "فهمت! غانعاونك. قولي أكثر شنو خاصك بالضبط؟",
}


def get_mock_response(message: str) -> str:
    """Retourne une réponse mock basée sur les mots-clés."""
    for keyword, response in MOCK_LLM_RESPONSES.items():
        if keyword != "default" and keyword.lower() in message.lower():
            return response
    return MOCK_LLM_RESPONSES["default"]


async def run_demo_scenario(scenario: dict, delay: float = 0.5) -> None:
    """Exécute un scénario de démo complet."""
    print(f"\n{'='*60}")
    print(f"🎭 Scénario : {scenario['nom']}")
    print(f"🌍 Langue : {scenario['language']}")
    print(f"{'='*60}")

    for i, message in enumerate(scenario["messages"], 1):
        print(f"\n👤 Citoyen [{i}]: {message}")
        response = get_mock_response(message)
        await asyncio.sleep(delay)
        print(f"🤖 Khidmati : {response}")


async def main():
    """Lance tous les scénarios de démo."""
    print("🚀 Khidmati AI — Démonstration des scénarios")
    print("=" * 60)

    scenarios = [SCENARIO_1, SCENARIO_2, SCENARIO_3]
    for scenario in scenarios:
        await run_demo_scenario(scenario, delay=0.3)
        await asyncio.sleep(1.0)

    print(f"\n{'='*60}")
    print("✅ Démo terminée ! Khidmati AI fonctionne correctement.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
