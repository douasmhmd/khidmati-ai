from pydantic import BaseModel
from typing import Optional, List


class ChecklistItem(BaseModel):
    """Un document dans la checklist d'une démarche."""
    nom: str
    obligatoire: bool = True
    description: Optional[str] = None


class Guichet(BaseModel):
    """Informations sur un guichet administratif."""
    nom: str
    adresse: str
    horaires: Optional[str] = None
    telephone: Optional[str] = None


class DemarcheInfo(BaseModel):
    """Informations complètes sur une démarche administrative."""
    id: str
    nom: dict
    description_simple: Optional[dict] = None
    documents_requis: Optional[dict] = None
    guichets_rabat: Optional[List[dict]] = None
    delai_traitement: Optional[str] = None
    cout: Optional[str] = None
    etapes: Optional[List[str]] = None
