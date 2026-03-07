FROM python:3.11-slim

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-ara \
    tesseract-ocr-fra \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

MISTRAL_API_KEY = "aZkiDpqhyIMJf3CmgxA9mmwPS0giq9Fi"  

# 2. Ollama URL (for local fallback)
OLLAMA_URL = "http://localhost:11434" 