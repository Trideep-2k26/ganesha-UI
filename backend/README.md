# Ganesha Voice Chatbot Backend (FastAPI)

Backend API providing chat (LLM via Mistral/OpenAI), TTS, STT placeholder, lipsync utilities, and safety guardrails.

## Features
- Chat endpoint using your provided LLM client (Mistral by default) and safety checks
- TTS using `pyttsx3` (Windows SAPI5; returns WAV)
- STT placeholder endpoint (plug in Whisper/Azure/GCP as needed)
- Lipsync viseme generator (simple approx for demo)
- CORS enabled for local dev frontends
- Swagger UI: `/docs`, ReDoc: `/redoc`
- Pytest tests

## Setup (Windows PowerShell)
```powershell
# 1) Create venv
py -3 -m venv .venv

# 2) Activate
.\.venv\Scripts\Activate

# 3) Upgrade pip and install deps
python -m pip install -U pip
pip install -r backend/requirements.txt

# 4) Copy env template and edit
Copy-Item backend\.env.example backend\.env
# Fill MISTRAL_API_KEY if you want real LLM responses. Without it, the API returns a friendly fallback message.

# 5) Run API
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
# Swagger: http://127.0.0.1:8000/docs
```

## Running tests
```powershell
.\.venv\Scripts\Activate
$env:PYTHONPATH="backend"
python -m pytest backend/tests -q
```

## Endpoints
- GET `/` root
- GET `/health`, GET `/ready`
- POST `/chat` with body `{ text, language?, temperature?, context? }`
- POST `/tts` with body `{ text, language?, voice?, rate? }` -> returns WAV file
- POST `/stt` with form-data `audio` (file) -> returns placeholder transcription
- POST `/lipsync` with body `{ text }` -> returns visemes

## Notes
- Safety is keyword-based for demo; integrate a moderation API for production.
- TTS uses temp WAV files; the endpoint cleans up after sending.
- STT is a stub; wire to Whisper/Azure/GCP as needed.
