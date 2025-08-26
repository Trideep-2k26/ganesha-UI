# 🕉️ Ganesha Voice Chatbot

A **multilingual voice chatbot** embodying **Lord Ganesha**, with real-time speech recognition, LLM-powered chat responses, text-to-speech synthesis, and animated UI.

This **monorepo** contains both **backend (FastAPI)** and **frontend (React + Vite + Tailwind)** for a complete end-to-end system.

> ⚠️ **Note:** All features and implementation are currently available in the **`feat` branch**, not in the `main` branch.

---
🚀 **[▶️ Watch the Demo Video](https://trideep1315.sirv.com/Divine%20Conversation%20-%20Lord%20Ganesha%20Chatbot%20-%20Google%20Chrome%202025-08-26%2015-39-01.mp4)** 🚀

## 🚀 Features

* 🎙️ **Speech-to-Text (STT)** – voice input (Web Speech API placeholder, pluggable for Whisper/Azure/GCP).
* 🧠 **Chat API (LLM)** – powered by **Mistral** (default) or **OpenAI GPT** for intelligent responses.
* 🔊 **Text-to-Speech (TTS)** – supports `edge-tts` (MP3) or `pyttsx3` (WAV).
* 🔒 **Safety Checks** – lightweight keyword-based content moderation.
* 🌐 **Frontend (React SPA)** – animated Ganesh UI with mic button, language switcher, settings panel, and TTS auto-play.
* 📱 **Multilingual Support** – English, Hindi, Tamil, Telugu, Marathi, Gujarati (BCP-47 codes).
* ☁️ **Deploy-ready** – Netlify config for frontend, FastAPI backend deployable to any Python host.

---

## 🏗️ System Architecture

```
 ┌───────────────────────┐      ┌────────────────────────────┐
 │  🎙️ User Microphone   │      │   🎨 React Frontend (Vite) │
 │  (Web Speech API /    │──▶──▶│  - UI/UX (voice & text)   │
 │   browser capture)    │      │  - Calls REST APIs         │
 └───────────────────────┘      └───────────┬────────────────┘
                                            │ REST (HTTP/JSON)
                                            ▼
                                 ┌──────────────────────────────┐
                                 │   ⚡ FastAPI Backend          │
                                 │                              │
                                 │  /chat  → LLM (Mistral/OpenAI│
                                 │  /tts   → edge-tts/pyttsx3   │
                                 │  /stt   → placeholder/Whisper│
                                 │  /lipsync → viseme timings   │
                                 └───────────┬──────────────────┘
                                             │
             ┌──────────────────────┐        │
             │ 🤖 LLM Provider      │        │ 🔊 TTS Provider
             │ (Mistral/OpenAI)     │        │ (Edge / pyttsx3)
             └──────────────────────┘        └─────────────────┘
```

---

## 🛠️ Tools & Technologies

### Backend

* **FastAPI** – API framework
* **Uvicorn** – ASGI server
* **LLMs** – Mistral (`mistral-small-latest`)
* **TTS** – edge-tts (default, MP3), pyttsx3 (offline, WAV)
* **STT** – placeholder, extensible to Whisper
* **Pytest** – backend testing

### Frontend

* **React + Vite** – single-page app framework
* **TypeScript** – strict typing
* **TailwindCSS** – modern utility styling
* **PWA-ready** – service worker, manifest.json
* **Netlify** – deployment config

---

## ⚙️ Backend Setup

```powershell
# Python 3.10+
py -3 -m venv .venv
.\.venv\Scripts\Activate
pip install -r backend/requirements.txt

# Create .env
@'
LLM_PROVIDER=mistral
MISTRAL_API_KEY=YOUR_KEY
MISTRAL_MODEL=mistral-small-latest


TTS_PROVIDER=edge-tts
HTTP_RETRY_TOTAL=3
CHAT_MAX_TOKENS=400
'@ | Out-File -Encoding utf8 backend/.env

# Run API
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```

Visit: **[http://ganesh-backend-copy-production.up.railway.app](http://ganesh-backend-copy-production.up.railway.app)** (Swagger UI).

---

## 🎨 Frontend Setup

```powershell
# Install dependencies
npm install

# Create .env
@"VITE_API_BASE=http://127.0.0.1:8000"@ | Out-File -Encoding utf8 project/.env

# Start dev server
npm run dev 
```

Visit: **[https://ganeshabot.netlify.app](https://ganeshabot.netlify.app)**

---

## 🔗 Executable Links

* **Backend Swagger** → `http://127.0.0.1:8000/docs`
* **Frontend Dev** → `http://127.0.0.1:3000`
* **Frontend Prod (Netlify)** → configure `netlify.toml` and deploy

---

## 📚 Backend Endpoints

* **`GET /`** – health/info
* **`GET /health`**, **`/ready`** – readiness checks
* **`POST /chat/`** – LLM chat
* **`POST /tts/`** – text-to-speech
* **`GET /tts/voices`** – available voices
* **`POST /stt/`** – audio → text (stub)

---

## 📂 Directory Structure

```
.
├── backend/
│   ├── app/
│   │   ├── routes/       # chat.py, tts.py, stt.py, lipsync.py
│   │   ├── schemas/      # request/response models
│   │   └── services/     # llm_client, tts_engine, safety, prompts
│   ├── tests/            # pytest
│   └── requirements.txt
└── project/
    ├── src/
    │   ├── App.tsx       # main app
    │   ├── hooks/        # useVoiceRecognition
    │   ├── services/api.ts
    │   └── components/
    ├── public/           # manifest.json, sw.js
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 🔍 Backend: How it works (functionality) and Tech Stack

### Overview

* FastAPI app exposing Chat (LLM), Text-to-Speech (TTS), Speech-to-Text (placeholder), and Lipsync utilities.
* Entry: `backend/app/main.py`

  * Registers routers: chat, tts, stt, lipsync, health.
  * CORS: permissive via `CORSMiddleware` (allows all origins).

### Endpoints and Flow

* **Chat: `POST /chat/`**

  * Detects language using `langdetect` if not provided.
  * Builds system prompt with divine persona from `services/prompts.py`.
  * Includes optional context and last 8 messages from history.
  * Runs keyword-based safety checks on input/output via `services/safety.py`.
  * Calls `LLMClient.chat()` to hit Mistral or OpenAI API with retries/timeouts.
  * Returns structured `ChatResponse` with text, language, safety flags, and metadata.

* **TTS: `POST /tts/`**

  * Provider chosen via env: `edge-tts` (MP3) or `pyttsx3` (WAV).
  * Configures voice/rate, synthesizes to temp file, responds with audio.
  * Auto-cleans temp files. `GET /tts/voices` lists voices.

* **STT: `POST /stt/`**

  * Accepts audio upload, currently placeholder response.
  * Extensible to Whisper/Azure/GCP via `services/stt_engine.py`.

* **Lipsync: `POST /lipsync/`**

  * Returns naive viseme timeline from text (8 chars/sec heuristic).

* **Health/Root**

  * `GET /health`, `GET /ready`, `GET /` → status checks and index info.

### Core Services

* **LLM client:** (`services/llm_client.py`)

  * Env provider: `LLM_PROVIDER=mistral|openai`.
  * Supports Mistral (`MISTRAL_API_KEY`, `MISTRAL_MODEL`).
  * Uses `requests.Session` with retry policy and timeouts.

* **TTS engine:** (`services/tts_engine.py`)

  * Edge: async `edge_tts.Communicate` → MP3.
  * pyttsx3: WAV with heuristics for voices.

* **Safety:** (`services/safety.py`)

  * Regex keyword filters for offensive/political content.

* **Prompts:** (`services/prompts.py`)

  * Divine persona + language-specific instructions.

### Schemas

* `schemas/chat.py` – ChatRequest, ChatResponse.
* `schemas/tts.py` – TTSRequest.
* `schemas/stt.py` – STTResponse.

### Tech Stack (Backend)

* FastAPI, Uvicorn
* Pydantic v2
* Requests + urllib3
* python-dotenv
* langdetect
* edge-tts, pyttsx3
* python-multipart, aiofiles
* pytest, httpx
* Stdlib: logging, tempfile, asyncio

### Configuration (env highlights)

* LLM: `LLM_PROVIDER`, `MISTRAL_API_KEY`/`MISTRAL_MODEL`
* TTS: `TTS_PROVIDER`
* Networking: `HTTP_RETRY_TOTAL`, `HTTP_RETRY_BACKOFF`, `LLM_TIMEOUT_SECONDS`
* SSL/Proxy: `REQUESTS_CA_BUNDLE`, `DISABLE_SSL_VERIFY`

**Summary:** The backend orchestrates chat flow via an external LLM, applies safety filters, generates audio with Edge or pyttsx3, offers a stub STT, and provides lipsync helpers. Fully configurable via environment variables.

---

## 🧪 Testing

```powershell
# Backend tests
.\.venv\Scripts\Activate
$env:PYTHONPATH="backend"
pytest backend/tests -q
```

---

## 📌 Current Limitations

* STT is a **stub** → replace with Whisper/Azure/GCP.
* Safety is **keyword-based** → replace with real moderation APIs.
* Mobile mic support varies across browsers.

---

