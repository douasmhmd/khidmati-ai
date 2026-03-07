from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
import tempfile
import os
import shutil
from services.ocr_service import extract_document_data

router = APIRouter()


@router.post("/")
async def process_document(
    image: UploadFile = File(...),
    document_hint: Optional[str] = Form("auto"),
):
    """Extrait les données d'un document administratif (CIN, acte de naissance…)."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        shutil.copyfileobj(image.file, tmp)
        tmp_path = tmp.name
    try:
        result = await extract_document_data(tmp_path, document_hint)
        return result
    finally:
        os.unlink(tmp_path)
