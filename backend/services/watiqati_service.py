"""
Service Watiqati — Extraction LLM + Automatisation watiqati.ma via Playwright.
"""

import logging
import json
import re
import httpx
from typing import Optional

from config import MISTRAL_API_KEY

logger = logging.getLogger("khidmati.watiqati")

EXTRACTION_PROMPT = (
    "Tu es un extracteur de données strict.\n"
    "L'utilisateur te parle en Darija pour demander un document administratif (comme sur watiqati.ma).\n"
    "Ton SEUL but est d'extraire les informations et de répondre UNIQUEMENT avec un objet JSON valide, "
    "sans aucun texte avant ou après. Ne pose pas de questions.\n\n"
    "Champs à extraire (mettre null si l'info manque) :\n"
    "- type_document\n"
    "- prenom\n"
    "- nom\n"
    "- cin\n"
    "- date_naissance\n\n"
    "Types de documents reconnus : copie_integrale, extrait_naissance, certificat_residence, "
    "certificat_nationalite, casier_judiciaire\n\n"
    'Exemple de sortie : {"type_document": "copie_integrale", "prenom": "Mohammed", '
    '"nom": "Belhaj", "cin": "BK123456", "date_naissance": "1990-01-01"}'
)


async def extract_document_request(text: str) -> dict:
    """
    Utilise le LLM (Mistral) pour extraire les champs d'une demande de document en Darija.
    Retourne un dict avec les champs structurés.
    """
    messages = [
        {"role": "system", "content": EXTRACTION_PROMPT},
        {"role": "user", "content": text},
    ]

    raw = None

    if MISTRAL_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.mistral.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {MISTRAL_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "mistral-small-latest",
                        "messages": messages,
                        "max_tokens": 150,
                        "temperature": 0.1,
                    },
                )
                response.raise_for_status()
                raw = response.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"LLM extraction raw: {raw}")
        except Exception as e:
            logger.warning(f"Mistral extraction failed: {e}")

    # Fallback mock si pas de clé ou erreur
    if raw is None:
        return {
            "type_document": "copie_integrale",
            "prenom": None,
            "nom": None,
            "cin": None,
            "date_naissance": None,
            "_mock": True,
        }

    # Parser le JSON retourné par le LLM
    try:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            data = json.loads(match.group(0))
            data["_mock"] = False
            return data
    except Exception as e:
        logger.warning(f"JSON parse error: {e}, raw={raw}")

    return {"_mock": True, "error": "parse_failed", "raw": raw}


async def submit_to_watiqati(data: dict) -> dict:
    """
    Lance Playwright pour remplir et soumettre le formulaire sur watiqati.ma.
    Retourne le statut de la soumission et la référence obtenue.
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("Playwright non installé — simulation mock activée")
        return {
            "success": True,
            "status": "mock",
            "message": "Playwright non installé — simulation réussie pour la démo hackathon",
            "reference": "MOCK-KHIDMATI-2026-001",
            "fields_filled": [k for k, v in data.items() if v and not k.startswith("_")],
        }

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                locale="fr-MA",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            )
            page = await context.new_page()

            logger.info("Playwright: navigation vers watiqati.ma")
            await page.goto("https://www.watiqati.ma", timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=15000)

            # ---- Sélection du type de document ----
            type_doc = (data.get("type_document") or "copie_integrale").lower()
            doc_selectors = {
                "copie_integrale": ["text=Copie intégrale", "text=acte de naissance", "a:has-text('naissance')"],
                "extrait_naissance": ["text=Extrait", "text=naissance"],
                "certificat_residence": ["text=résidence", "text=Certificat de résidence"],
                "certificat_nationalite": ["text=nationalité", "text=Nationalité"],
                "casier_judiciaire": ["text=casier", "text=judiciaire"],
            }
            selectors_to_try = doc_selectors.get(type_doc, doc_selectors["copie_integrale"])
            for sel in selectors_to_try:
                try:
                    await page.click(sel, timeout=4000)
                    logger.info(f"Type document sélectionné via: {sel}")
                    break
                except Exception:
                    continue

            await page.wait_for_timeout(2000)

            # ---- Remplissage des champs ----
            field_selectors = {
                "nom": ["#nom", "[name='nom']", "[name='lastName']", "input[placeholder*='Nom']"],
                "prenom": ["#prenom", "[name='prenom']", "[name='firstName']", "input[placeholder*='Prénom']"],
                "cin": ["#cin", "[name='cin']", "[name='numCin']", "[name='nCin']", "input[placeholder*='CIN']"],
                "date_naissance": [
                    "#dateNaissance", "[name='dateNaissance']", "[name='birthDate']", "input[type='date']"
                ],
            }

            filled = []
            for field, selectors in field_selectors.items():
                value = data.get(field)
                if not value:
                    continue
                for sel in selectors:
                    try:
                        await page.fill(sel, str(value), timeout=3000)
                        filled.append(field)
                        logger.info(f"Champ '{field}' rempli")
                        break
                    except Exception:
                        continue

            await page.wait_for_timeout(1000)

            # ---- Soumission ----
            submit_selectors = [
                "button[type='submit']",
                "#btn_submit",
                "#btnSuivant",
                "button:has-text('Suivant')",
                "button:has-text('Envoyer')",
                "button:has-text('Valider')",
                "input[type='submit']",
            ]
            submitted = False
            for sel in submit_selectors:
                try:
                    await page.click(sel, timeout=3000)
                    submitted = True
                    logger.info(f"Formulaire soumis via: {sel}")
                    break
                except Exception:
                    continue

            await page.wait_for_timeout(3000)

            # ---- Récupérer la référence ----
            reference = None
            ref_selectors = [
                ".reference", "#reference", "#numDemande",
                ".confirmation-number", "[class*='ref']", "[class*='confirmation']",
                "p:has-text('Référence')", "span:has-text('N°')",
            ]
            for sel in ref_selectors:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        reference = (await el.inner_text()).strip()
                        logger.info(f"Référence obtenue: {reference}")
                        break
                except Exception:
                    continue

            await browser.close()

            return {
                "success": True,
                "status": "submitted" if submitted else "partial",
                "fields_filled": filled,
                "reference": reference or "En attente de confirmation par SMS",
                "message": (
                    "Formulaire soumis avec succès sur watiqati.ma"
                    if submitted
                    else "Formulaire partiellement rempli — vérification manuelle requise"
                ),
            }

    except Exception as e:
        logger.error(f"Playwright error: {e}")
        return {
            "success": False,
            "status": "error",
            "message": f"Erreur automatisation: {str(e)}",
        }
