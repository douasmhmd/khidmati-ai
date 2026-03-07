import os
from dotenv import load_dotenv

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./khidmati.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
