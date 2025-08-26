import os
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.schemas.tts import TTSRequest
from app.services.tts_engine import TTSEngine

router = APIRouter(prefix="/tts", tags=["tts"])


@router.post("/", response_class=FileResponse)
async def tts_endpoint(req: TTSRequest, background: BackgroundTasks):
    engine = TTSEngine()
    try:
        engine.configure(language=req.language, voice=req.voice, rate=req.rate)
        path, _duration_ms, mime = await engine.synthesize(req.text)
        headers = {"X-Generated-By": engine.provider}
        # schedule cleanup of temp file after response is sent
        background.add_task(os.remove, path)
        # choose filename by mime
        filename = "ganesha_voice.wav" if mime == "audio/wav" else "ganesha_voice.mp3"
        return FileResponse(
            path,
            media_type=mime,
            filename=filename,
            headers=headers,
            background=background,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {e}")
    finally:
        try:
            engine.close()
        except Exception:
            pass


@router.get("/voices")
def list_voices():
    engine = TTSEngine()
    try:
        voices = engine.list_voices()
        return {"voices": voices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list voices: {e}")
    finally:
        try:
            engine.close()
        except Exception:
            pass
