from fastapi import APIRouter, HTTPException
import json
import os
from functools import lru_cache

router = APIRouter()


@lru_cache(maxsize=1)
def load_demarches():
    """Charge le fichier JSON des démarches (mis en cache)."""
    data_path = os.path.join(os.path.dirname(__file__), "../data/demarches_rabat.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/")
async def get_all_demarches():
    """Retourne la liste de toutes les démarches disponibles."""
    data = load_demarches()
    return {"demarches": [{"id": d["id"], "nom": d["nom"]} for d in data["demarches"]]}


@router.get("/{demarche_id}")
async def get_demarche(demarche_id: str):
    """Retourne le détail d'une démarche par son identifiant."""
    data = load_demarches()
    for d in data["demarches"]:
        if d["id"] == demarche_id:
            return d
    raise HTTPException(status_code=404, detail=f"Démarche '{demarche_id}' non trouvée")
