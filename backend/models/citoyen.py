from pydantic import BaseModel
from typing import Optional, List


class CitoyenProfile(BaseModel):
    """Profil du citoyen pour personnaliser l'assistance."""
    language_preference: str = "darija"
    accessibility_needs: bool = False
    demarche_en_cours: Optional[str] = None
    collected_data: dict = {}
