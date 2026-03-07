"""
Service OCR — Extraction des données de documents administratifs.
Utilise Tesseract (ara+fra) avec fallback mock.
"""

import re
import logging
import asyncio
from typing import Optional

logger = logging.getLogger("khidmati.ocr")


def _detect_document_type(text: str) -> str:
    """Détecte le type de document à partir du texte OCR extrait."""
    text_lower = text.lower()
    # Carte d'identité nationale
    if any(kw in text_lower for kw in ["بطاقة وطنية", "cin", "carte nationale", "رقم البطاقة"]):
        return "cin"
    # Acte de naissance
    if any(kw in text_lower for kw in ["شهادة الميلاد", "acte de naissance", "نسخة من رسم الولادة"]):
        return "acte_naissance"
    # Document générique en arabe/français
    if any(kw in text_lower for kw in ["المملكة المغربية", "royaume du maroc"]):
        return "generique"
    return "inconnu"


def _extract_cin_fields(text: str) -> dict:
    """Extrait les champs d'une Carte d'Identité Nationale."""
    # Extraction basique par heuristique (Tesseract produit du texte brut)
    fields = {
        "nom": "",
        "prenom": "",
        "date_naissance": "",
        "lieu_naissance": "",
        "adresse": "",
        "numero_cin": "",
        "date_expiration": "",
    }
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for i, line in enumerate(lines):
        if "nom" in line.lower() and i + 1 < len(lines):
            fields["nom"] = lines[i + 1]
        if "prénom" in line.lower() or "prenom" in line.lower():
            if i + 1 < len(lines):
                fields["prenom"] = lines[i + 1]
        # Numéro CIN : format lettre + 6 chiffres
        cin_match = re.search(r"\b[A-Z]{1,2}\d{5,6}\b", line)
        if cin_match:
            fields["numero_cin"] = cin_match.group()
        # Date au format DD/MM/YYYY ou DD-MM-YYYY
        date_match = re.search(r"\b(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})\b", line)
        if date_match and not fields["date_naissance"]:
            fields["date_naissance"] = date_match.group()
    return fields


def _extract_acte_fields(text: str) -> dict:
    """Extrait les champs d'un acte de naissance."""
    fields = {
        "nom": "",
        "prenom": "",
        "date_naissance": "",
        "lieu_naissance": "",
        "nom_pere": "",
        "nom_mere": "",
        "numero_acte": "",
    }
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for i, line in enumerate(lines):
        if "رقم" in line or "numéro" in line.lower():
            num_match = re.search(r"\d+", line)
            if num_match:
                fields["numero_acte"] = num_match.group()
        date_match = re.search(r"\b(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})\b", line)
        if date_match and not fields["date_naissance"]:
            fields["date_naissance"] = date_match.group()
    return fields


def _get_mock_document_data(document_hint: str) -> dict:
    """Retourne des données mock pour la démo."""
    mock_cin = {
        "extracted_data": {
            "nom": "BELHAJ",
            "prenom": "Mohammed",
            "date_naissance": "15/03/1985",
            "lieu_naissance": "Rabat",
            "adresse": "Avenue Mohammed V, Rabat",
            "numero_cin": "BK123456",
            "date_expiration": "15/03/2030",
        },
        "document_type": "cin",
        "confidence": 0.92,
        "_mock": True,
    }
    mock_acte = {
        "extracted_data": {
            "nom": "ALAOUI",
            "prenom": "Fatima",
            "date_naissance": "20/06/1990",
            "lieu_naissance": "Salé",
            "nom_pere": "Ahmed ALAOUI",
            "nom_mere": "Khadija BENALI",
            "numero_acte": "4521",
        },
        "document_type": "acte_naissance",
        "confidence": 0.88,
        "_mock": True,
    }
    if document_hint == "acte_naissance":
        return mock_acte
    return mock_cin


async def extract_document_data(image_path: str, document_hint: Optional[str] = "auto") -> dict:
    """
    Extrait les données d'un document administratif via OCR.
    Tente Tesseract → Mock si indisponible.
    """
    try:
        import pytesseract
        from PIL import Image

        loop = asyncio.get_event_loop()

        def _ocr_task():
            img = Image.open(image_path)
            # OCR en arabe et français
            text = pytesseract.image_to_string(img, lang="ara+fra")
            return text

        text = await loop.run_in_executor(None, _ocr_task)

        if not text.strip():
            logger.warning("OCR n'a extrait aucun texte, utilisation du mock")
            return _get_mock_document_data(document_hint or "auto")

        # Détection du type de document
        doc_type = document_hint if document_hint not in ("auto", None) else _detect_document_type(text)

        # Extraction des champs selon le type
        if doc_type == "cin":
            extracted = _extract_cin_fields(text)
        elif doc_type == "acte_naissance":
            extracted = _extract_acte_fields(text)
        else:
            extracted = {"raw_text": text[:500]}

        # Calcul de la confiance (simple heuristique)
        filled_fields = sum(1 for v in extracted.values() if v)
        total_fields = len(extracted)
        confidence = filled_fields / total_fields if total_fields > 0 else 0.0

        result = {
            "extracted_data": extracted,
            "document_type": doc_type,
            "confidence": round(confidence, 2),
            "_mock": False,
        }

        # Conseil qualité photo si confiance faible
        if confidence < 0.5:
            result["conseil"] = "الصورة ما زال خاصها تكون أوضح! دير الصورة فضوء مزيان بلا ظل 📸"

        return result

    except ImportError:
        logger.warning("pytesseract non installé → mock")
        return _get_mock_document_data(document_hint or "auto")
    except Exception as e:
        logger.error(f"Erreur OCR: {e}")
        return _get_mock_document_data(document_hint or "auto")
