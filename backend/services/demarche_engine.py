"""
Moteur de démarches administratives — Gestion des workflows et checklists.
"""

import json
import os
import logging
from typing import Optional

logger = logging.getLogger("khidmati.demarche")

# Chemin vers les données
DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/demarches_rabat.json")


class DemarcheEngine:
    """Moteur qui gère les démarches administratives marocaines."""

    def __init__(self):
        """Charge les données des démarches au démarrage."""
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.demarches = {d["id"]: d for d in data["demarches"]}
            logger.info(f"{len(self.demarches)} démarches chargées")
        except Exception as e:
            logger.error(f"Impossible de charger les démarches: {e}")
            self.demarches = {}

    def identify_demarche(self, message: str, language: str = "darija") -> str:
        """
        Identifie la démarche mentionnée dans le message.
        Retourne l'ID ou 'inconnu'.
        """
        message_lower = message.lower()
        keywords_map = {
            "renouvellement_cin": ["بطاقة", "سيبيه", "cin", "carte nationale", "تجديد"],
            "acte_naissance": ["ميلاد", "شهادة", "naissance", "acte", "عقد"],
            "inscription_ramed": ["راميد", "ramed", "صحة", "مجانية", "assurance"],
            "legalisation": ["إمضاء", "تصحيح", "légalisation", "signature", "توقيع"],
        }
        for demarche_id, keywords in keywords_map.items():
            for kw in keywords:
                if kw.lower() in message_lower:
                    return demarche_id
        return "inconnu"

    def get_next_question(
        self, demarche_id: str, collected_data: dict, language: str = "darija"
    ) -> Optional[dict]:
        """
        Retourne la prochaine question à poser pour collecter les données manquantes.
        Retourne None si toutes les données sont collectées.
        """
        demarche = self.demarches.get(demarche_id)
        if not demarche:
            return None

        questions = demarche.get("questions_collecte", [])
        for i, q in enumerate(questions):
            q_id = q["id"]
            if q_id not in collected_data:
                lang_key = "darija" if language == "darija" else ("ar" if language == "arabic" else "fr")
                question_text = q.get("question", {})
                if isinstance(question_text, dict):
                    text = question_text.get(lang_key, question_text.get("darija", ""))
                else:
                    text = str(question_text)
                return {
                    "question_id": q_id,
                    "question_text": text,
                    "question_type": q.get("type", "text"),
                    "options": q.get("options", []),
                    "is_last": i == len(questions) - 1,
                }
        return None

    def generate_checklist(
        self, demarche_id: str, collected_data: dict, language: str = "darija"
    ) -> dict:
        """
        Génère la checklist des documents nécessaires pour la démarche.
        """
        demarche = self.demarches.get(demarche_id)
        if not demarche:
            return {
                "title": "Démarche inconnue",
                "documents": [],
                "guichet_recommande": None,
                "message_final": "ما لقيناش هاد الخدمة. قولنا واحدة خرى.",
            }

        lang_key = "darija" if language == "darija" else ("ar" if language == "arabic" else "fr")

        # Titre de la démarche
        nom = demarche.get("nom", {})
        title = nom.get(lang_key, nom.get("fr", demarche_id)) if isinstance(nom, dict) else str(nom)

        # Documents requis
        docs_requis = demarche.get("documents_requis", {})
        docs_base = docs_requis.get("de_base", [])
        documents = []
        for doc in docs_base:
            doc_name = doc if isinstance(doc, str) else doc.get(lang_key, doc.get("fr", str(doc)))
            documents.append({"nom": doc_name, "obligatoire": True})

        # Guichet recommandé (premier de la liste)
        guichets = demarche.get("guichets_rabat", [])
        guichet = guichets[0] if guichets else None

        # Message final
        delai = demarche.get("delai_traitement", "")
        cout = demarche.get("cout", "")
        if language == "darija":
            message_final = f"جمع الوثائق وروح للمكتب! التكلفة: {cout}. المدة: {delai} 💪"
        elif language == "arabic":
            message_final = f"جمع الوثائق وتوجه للمكتب! التكلفة: {cout}. المدة: {delai}"
        else:
            message_final = f"Rassemblez les documents et rendez-vous au guichet ! Coût: {cout}. Délai: {delai}"

        return {
            "title": title,
            "documents": documents,
            "guichet_recommande": guichet,
            "message_final": message_final,
        }

    def is_data_sufficient(self, demarche_id: str, collected_data: dict) -> bool:
        """Vérifie si toutes les données nécessaires ont été collectées."""
        demarche = self.demarches.get(demarche_id)
        if not demarche:
            return False
        required_questions = [
            q["id"] for q in demarche.get("questions_collecte", [])
            if q.get("required", True)
        ]
        return all(q_id in collected_data for q_id in required_questions)
