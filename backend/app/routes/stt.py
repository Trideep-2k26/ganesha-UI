from fastapi import APIRouter, UploadFile, File, HTTPException

from app.schemas.stt import STTResponse
from app.services.stt_engine import STTEngine

router = APIRouter(prefix="/stt", tags=["stt"])


@router.post("/", response_model=STTResponse)
async def stt_endpoint(audio: UploadFile = File(...)):
    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is required")

    data = await audio.read()
    engine = STTEngine()
    text, lang = engine.transcribe(data)
    return STTResponse(text=text, language=lang, note="This is a placeholder STT response. Configure a real provider.")
