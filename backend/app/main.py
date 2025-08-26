import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.tts import router as tts_router
from app.routes.stt import router as stt_router
from app.routes.lipsync import router as lipsync_router


def get_allowed_origins() -> list[str]:
    origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,https://ganeshabot.netlify.app,https://ganeshabot.netlify.app/",
    )
    return [o.strip() for o in origins.split(",") if o.strip()]


app = FastAPI(
    title="Ganesha Voice Chatbot API",
    version="0.1.0",
    description="Backend API providing chat (LLM), TTS, STT, safety, and lipsync utilities for the Ganesha booth chatbot.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow everything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(tts_router)
app.include_router(stt_router)
app.include_router(lipsync_router)


@app.get("/")
def root():
    return {"message": "Ganesha Voice Chatbot API is running", "docs": "/docs"}
