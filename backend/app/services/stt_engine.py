from typing import Optional


class STTEngine:
    """
    Placeholder STT Engine.
    Integrate a real provider (Whisper, Azure, GCP) as needed.
    """

    def transcribe(self, audio_bytes: bytes, language_hint: Optional[str] = None) -> tuple[str, Optional[str]]:
        # TODO: Replace with a real STT model call.
        # Returning a canned response to keep API and tests working without heavy deps.
        return ("Transcription service not configured.", language_hint)
