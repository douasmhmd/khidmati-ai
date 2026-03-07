import os
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./khidmati.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# OpenAI Whisper API — STT Darija/Arabe sans GPU (priorité 1)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# HuggingFace Inference API — STT fallback (priorité 2)
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")
HF_STT_MODEL = os.getenv("HF_STT_MODEL", "openai/whisper-large-v3")
