# Khidmati AI — خدمتي 🤖🇲🇦

Assistant IA pour les démarches administratives marocaines  
Hackathon RamadanAI 2026 · Région Rabat-Salé-Kénitra

## Lancement rapide (3 commandes)

```bash
git clone https://github.com/douasmhmd/khidmati-ai
cd khidmati-ai
docker-compose up -d
# Ouvrir http://localhost:3000
```

## Sans Docker

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
cd frontend && npm install && npm start
```

## Variables d'environnement (.env)

```env
MISTRAL_API_KEY=votre_clé  # Optionnel, mocks disponibles sans clé
OLLAMA_URL=http://localhost:11434
WHISPER_MODEL=small
```

## Démarches couvertes

1. Renouvellement CIN — 75 DH — 5-15 jours
2. Acte de naissance — Gratuit — Même jour
3. Inscription RAMED — Gratuit — 2-4 semaines
4. Légalisation signature — 15 DH — Même jour

## Architecture

```
Citoyen (Darija/Audio/Photo) → React Frontend → FastAPI Backend → Mistral LLM + Whisper ASR + Tesseract OCR
```

## Fonctionnalités

- 💬 **Chat Darija** — Interface conversationnelle en dialecte marocain
- 🎤 **Reconnaissance vocale** — Whisper ASR (fallback mock)
- 📷 **OCR documents** — Tesseract ara+fra (fallback mock)
- 📋 **Checklists automatiques** — Documents requis par démarche
- ♿ **Accessibilité** — Taille de police ajustable, contraste élevé, RTL
- 🔄 **Fallback triple** — Mistral API → Ollama → Mock (toujours fonctionnel)