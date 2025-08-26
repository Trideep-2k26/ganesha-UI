# Ganesha Voice Chatbot

Multilingual voice chatbot embodying Lord Ganesha. This monorepo contains:

- Backend: FastAPI APIs for Chat (LLM), Text-to-Speech (TTS), Speech-to-Text (STT placeholder), Lipsync utilities, and simple safety checks.
- Frontend: React + Vite single-page app with voice input UX and auto-TTS playback.

Links: Swagger UI at /docs on the backend. Netlify config included for frontend deploy.


## Quickstart (Windows PowerShell)

1) Backend setup

```powershell
# Python 3.10+
py -3 -m venv .venv
.\.venv\Scripts\Activate
python -m pip install -U pip
pip install -r backend/requirements.txt

# Create backend/.env (optional but recommended)
@'
# LLM provider: mistral (default) or openai
LLM_PROVIDER=mistral
# For Mistral
MISTRAL_API_KEY=YOUR_KEY
MISTRAL_MODEL=mistral-medium-latest
# For OpenAI (if switching)
# OPENAI_API_KEY=YOUR_KEY
# OPENAI_MODEL=gpt-4o

# TTS: edge-tts (default, MP3) or pyttsx3 (WAV)
TTS_PROVIDER=edge-tts

# HTTP robustness
HTTP_RETRY_TOTAL=3
HTTP_RETRY_BACKOFF=0.5
LLM_TIMEOUT_SECONDS=30
CHAT_MAX_TOKENS=400
'@ | Out-File -Encoding utf8 backend/.env

# Run API (http://127.0.0.1:8000/docs)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```

2) Frontend setup

```powershell
# In project/
npm i

# Create project/.env (point API to backend)
@"VITE_API_BASE=http://127.0.0.1:8000"@ | Out-File -Encoding utf8 project/.env

# Dev server (http://127.0.0.1:3000)
npm run dev --prefix project
```


## Architecture

- Backend entry: `backend/app/main.py`
  - Routers: `chat.py`, `tts.py`, `stt.py`, `lipsync.py`, `health.py`
  - Services: `llm_client.py` (Mistral/OpenAI), `tts_engine.py` (edge-tts/pyttsx3), `stt_engine.py` (placeholder), `safety.py`, `prompts.py`
  - Schemas: `schemas/chat.py`, `schemas/tts.py`, `schemas/stt.py`
- Frontend entry: `project/src/main.tsx`, app in `project/src/App.tsx`
  - API client: `project/src/services/api.ts` (uses `VITE_API_BASE`)
  - Vite config: `project/vite.config.ts`
  - Tailwind config: `project/tailwind.config.js`
  - PWA bits: `project/public/manifest.json`, `project/public/sw.js`


## Backend Endpoints

Base URL: your backend host (e.g., http://127.0.0.1:8000)

- GET `/` → `{ message, docs }`
- GET `/health` → `{ status: "ok" }`
- GET `/ready` → `{ status: "ready" }`

- POST `/chat/`
  - Body (JSON):
    - `text: string` (required)
    - `language?: string` (ISO code, auto-detected if omitted)
    - `temperature?: number` (default 0.6)
    - `context?: Record<string, any>`
    - `history?: Array<{ role: 'user'|'assistant'; content: string }>` (last 8 used)
  - Response (JSON):
    - `text: string`
    - `language: string`
    - `safety_flags: string[]` (e.g., offensive_content, political_content)
    - `meta: Record<string, any>` (includes `model`, `history_used`, `context_included`)
  - Notes: Input and output go through simple keyword safety checks.

- POST `/tts/`
  - Body (JSON): `{ text: string; language?: string; voice?: string; rate?: number }`
  - Response: audio file
    - Default provider `edge-tts` → `audio/mpeg` (MP3)
    - If `TTS_PROVIDER=pyttsx3` → `audio/wav` (WAV)
  - GET `/tts/voices` lists recommended voices (edge) or system voices (pyttsx3)

- POST `/stt/`
  - Form-data: `audio` (file)
  - Response (JSON): placeholder `{ text, language?, note }`
  - Integrate Whisper/Azure/GCP by replacing `STTEngine`.

- POST `/lipsync/`
  - Body (JSON): `{ text: string }`
  - Response (JSON): `{ visemes: Array<{ time: number; viseme: string }> }`
  - Simple 8 chars/sec heuristic with vowel-to-viseme mapping.


## Curl Examples

```bash
# Chat
curl -s http://127.0.0.1:8000/chat/ \
  -H 'Content-Type: application/json' \
  -d '{"text":"Bless me for my exam","language":"en","temperature":0.6}'

# TTS (downloads MP3 by default)
curl -s -o reply.mp3 http://127.0.0.1:8000/tts/ \
  -H 'Content-Type: application/json' \
  -d '{"text":"Ganpati Bappa Morya!","language":"hi","rate":195}'

# STT (placeholder)
curl -s http://127.0.0.1:8000/stt/ \
  -F "audio=@sample.wav"

# Lipsync
curl -s http://127.0.0.1:8000/lipsync/ \
  -H 'Content-Type: application/json' \
  -d '{"text":"Om Gan Ganapataye Namaha"}'
```


## Environment Variables (Backend)

- LLM selection
  - `LLM_PROVIDER`: `mistral` (default) | `openai`
  - Mistral: `MISTRAL_API_KEY`, `MISTRAL_API_URL` (default `https://api.mistral.ai/v1/chat/completions`), `MISTRAL_MODEL` (default `mistral-medium-latest`)
  - OpenAI: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o`)
- TTS
  - `TTS_PROVIDER`: `edge-tts` (default, MP3) or `pyttsx3` (WAV)
- Networking & timeouts
  - `HTTP_RETRY_TOTAL` (default 3), `HTTP_RETRY_BACKOFF` (default 0.5s)
  - `LLM_TIMEOUT_SECONDS` (default 30), `CHAT_MAX_TOKENS` (default 400)
  - `REQUESTS_CA_BUNDLE`/`SSL_CERT_FILE`/`CA_BUNDLE_PATH` for custom CA; `DISABLE_SSL_VERIFY=true` for diagnostics only
- CORS
  - App currently allows all origins via `CORSMiddleware`.


## Frontend Configuration

- API base: `project/src/services/api.ts` uses `VITE_API_BASE` (recommended). If unset, it falls back to a temporary tunnel URL. Set `project/.env`:
  - `VITE_API_BASE=http://127.0.0.1:8000`
- Vite dev server: `project/vite.config.ts` (port 3000)
- Tailwind theme: `project/tailwind.config.js`
- PWA/Service Worker: `project/public/sw.js` and `manifest.json`

Build and deploy:

```powershell
# Build SPA
npm run build --prefix project
# Output: project/dist/
```

Netlify (already configured): `project/netlify.toml`

```toml
[build]
  base = "project"
  command = "npm ci && npm run build"
  publish = "dist"

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Deploy backend to any Python host (e.g., VM/Render/Fly). Ensure public CORS and set frontend `VITE_API_BASE` to the backend URL.


## Testing

Backend tests (pytest):

```powershell
.\.venv\Scripts\Activate
$env:PYTHONPATH="backend"
python -m pytest backend/tests -q
```


## Current Limitations / Next Steps

- STT is a placeholder. Integrate Whisper/Azure/GCP in `backend/app/services/stt_engine.py`.
- Safety is keyword-based (`backend/app/services/safety.py`). Use a moderation API for production.
- Mobile microphone support varies by browser; frontend provides a text input fallback.


## Frontend Usage

- **Voice controls**
  - The round mic button (`VoiceButton`) toggles the browser's Web Speech API via `useVoiceRecognition()`.
  - Status: `isListening` (live), `isProcessing` (finalizing), `audioLevel` (visual pulse).
  - Language ↔ BCP-47 mapping in `App.tsx` (`en-US`, `hi-IN`, `ta-IN`, `te-IN`, `mr-IN`, `gu-IN`).
- **Language switcher**
  - Header dropdown changes `currentLanguage` (`Header` → `onLanguageChange`). Affects recognition locale and chat `language` param.
- **Text input**
  - Toggle with the Type icon button. Submit to send without using mic.
  - Setting `keepTextInputOpen` keeps the field visible after send.
- **Settings panel** (`SettingsPanel`)
  - `autoTTS` (auto-play assistant replies), `ttsRate`, `ttsVoice` (edge voices), `ttsVolume`, `temperature`, `keepTextInputOpen`.
  - Persisted in `localStorage` as `ganesha_settings`.
- **Session & history**
  - Frontend persists `ganesha_session_id` and sends recent 8 messages as `history` to `/chat/`.
- **Auto TTS playback**
  - Uses `/tts/` with backend-selected `language`. MP3 for edge-tts, WAV for pyttsx3.


## Directory Structure

```
.
├─ backend/
│  ├─ app/
│  │  ├─ routes/            # chat.py, tts.py, stt.py, lipsync.py, health.py
│  │  ├─ schemas/           # chat.py, tts.py, stt.py
│  │  └─ services/          # llm_client.py, tts_engine.py, stt_engine.py, safety.py, prompts.py
│  ├─ tests/                # pytest API tests
│  ├─ requirements.txt
│  └─ .env(.example)
└─ project/
   ├─ src/
   │  ├─ services/api.ts    # chatAPI, ttsAPI
   │  ├─ hooks/             # useVoiceRecognition
   │  ├─ components/
   │  └─ App.tsx
   ├─ public/               # manifest.json, sw.js
   ├─ vite.config.ts
   └─ netlify.toml
```


## Troubleshooting

- **Frontend can’t reach backend**
  - Set `project/.env`: `VITE_API_BASE=http://127.0.0.1:8000` (no trailing slash recommended).
  - Open `http://127.0.0.1:8000/docs` to verify backend is running.
- **CORS errors**
  - Backend enables permissive CORS. If still blocked, ensure proxies/CDN aren’t altering Origin/headers.
- **TTS errors**
  - `edge-tts`: requires internet; if unavailable, set `TTS_PROVIDER=pyttsx3` (WAV, local voices).
  - `pyttsx3`: voice availability depends on OS; install desired voices, or leave `voice` unset.
- **Microphone not working**
  - Allow mic permissions. Some browsers require HTTPS for getUserMedia(). Use text input as fallback.
  - Mobile browsers have limited support; desktop recommended for voice.
- **LLM timeouts/401**
  - Set proper API key (`MISTRAL_API_KEY` or `OPENAI_API_KEY`). Increase `LLM_TIMEOUT_SECONDS` if needed.
- **SSL issues behind corporate proxy**
  - Provide CA via `REQUESTS_CA_BUNDLE` or temporarily set `DISABLE_SSL_VERIFY=true` (development only).
- **Audio not playing**
  - Ensure a user interaction occurred (autoplay policies). Check `ttsVolume > 0` and MP3 support.


## STT Integration Guide (Replace Placeholder)

1) Choose a provider (OpenAI Whisper, Azure Cognitive Services, Google Cloud Speech-to-Text).
2) Implement in `backend/app/services/stt_engine.py`:
  - Replace the stub `transcribe()` to call the provider and return `STTResponse(text=..., language=...)`.
  - Add provider-specific error handling and timeouts.
3) Add environment variables and dependencies:
  - Example: provider SDK, credentials, region, model name.
4) Update `backend/app/routes/stt.py` if content type/params differ (e.g., mono WAV, sample rate).
5) Extend tests in `backend/tests/test_api.py` to validate real STT.
6) (Optional) Frontend: Instead of Web Speech API, POST mic audio to `/stt/` and pipe the response into `sendMessageToGanesha()`.
7) Consider rate limiting, file size caps, and async processing for large audio.


## License

MIT (or your preferred license).
