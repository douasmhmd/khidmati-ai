from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.watiqati_service import extract_document_request, submit_to_watiqati

router = APIRouter()


class ExtractRequest(BaseModel):
    text: str
    lang: str = "darija"


class SubmitRequest(BaseModel):
    type_document: Optional[str] = None
    prenom: Optional[str] = None
    nom: Optional[str] = None
    cin: Optional[str] = None
    date_naissance: Optional[str] = None


@router.post("/extract")
async def extract_watiqati_data(req: ExtractRequest):
    """Extrait les champs d'une demande de document depuis du texte Darija via LLM."""
    result = await extract_document_request(req.text)
    return result


@router.post("/submit")
async def submit_watiqati_form(req: SubmitRequest):
    """Lance Playwright pour remplir et soumettre le formulaire sur watiqati.ma."""
    data = req.model_dump()
    result = await submit_to_watiqati(data)
    return result
