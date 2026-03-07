import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import chat, audio, document, demarches

# Configuration du logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s — %(levelname)s — %(message)s")
logger = logging.getLogger("khidmati")

app = FastAPI(
    title="Khidmati AI",
    description="Assistant IA pour les démarches administratives marocaines",
    version="1.0.0-mvp",
)

# CORS pour le frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware qui log chaque requête entrante et sortante."""
    start_time = time.time()
    logger.info(f"→ {request.method} {request.url.path}")
    response = await call_next(request)
    duration = round((time.time() - start_time) * 1000, 2)
    logger.info(f"← {request.method} {request.url.path} [{response.status_code}] {duration}ms")
    return response


# Inclusion des routers
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(audio.router, prefix="/audio", tags=["Audio"])
app.include_router(document.router, prefix="/document", tags=["Document"])
app.include_router(demarches.router, prefix="/demarches", tags=["Démarches"])


@app.get("/health")
async def health():
    """Endpoint de vérification de santé du service."""
    return {"status": "ok", "service": "Khidmati AI", "version": "1.0.0-mvp"}


@app.get("/")
async def root():
    """Page d'accueil de l'API."""
    return {
        "message": "مرحبا بكم في خدمتي — Bienvenue sur Khidmati AI",
        "docs": "/docs",
        "health": "/health",
    }
