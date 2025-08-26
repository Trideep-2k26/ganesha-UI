import os
import tempfile
import asyncio
from typing import Optional, Tuple

from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

import pyttsx3
try:
    import edge_tts  # type: ignore
except Exception:  # pragma: no cover
    edge_tts = None


class TTSEngine:
    def __init__(self) -> None:
        # Provider: edge-tts (default) or pyttsx3
        self.provider = (os.getenv("TTS_PROVIDER", "edge-tts") or "edge-tts").lower()
        # Initialize engine if pyttsx3
        self.engine = None
        if self.provider == "pyttsx3":
            self.engine = pyttsx3.init()
        # Cache last config
        self._language: Optional[str] = None
        self._voice: Optional[str] = None
        self._rate: Optional[int] = None

    def configure(self, language: Optional[str] = None, voice: Optional[str] = None, rate: Optional[int] = None) -> None:
        # Cache for later use during synthesis
        self._language = language
        self._voice = voice
        self._rate = rate

        if self.provider == "pyttsx3":
            assert self.engine is not None
            # Always prioritize Indian voices for consistent experience
            selected_voice_id: Optional[str] = None
            voices = self.engine.getProperty("voices") or []

            # If an explicit voice is provided, use it only if male
            if voice:
                male_name_hints = [
                    "ravi", "heera", "prabhat", "madhur", "valluvar", "mohan",
                    "bashkar", "niranjan", "manohar", "gagan", "midhun", "gurpreet",
                ]
                for v in voices:
                    if voice.lower() in (getattr(v, "name", "") or "").lower():
                        g = str(getattr(v, "gender", "")).lower()
                        name = (getattr(v, "name", "") or "").lower()
                        if ("male" in g) or any(m in name for m in male_name_hints):
                            selected_voice_id = v.id
                        break

            # If no explicit voice or not found, prioritize Indian voices for all languages
            if not selected_voice_id:
                # First priority: Look for Indian voices regardless of language (prefer male)
                indian_voice_keywords = ["india", "indian", "hindi", "ravi", "heera", "kalpana"]
                male_name_hints = [
                    "ravi", "heera", "prabhat", "madhur", "valluvar", "mohan",
                    "bashkar", "niranjan", "manohar", "gagan", "midhun", "gurpreet",
                ]
                male_candidates = []
                any_candidates = []
                for v in voices:
                    name = (getattr(v, "name", "") or "").lower()
                    if any(keyword in name for keyword in indian_voice_keywords):
                        any_candidates.append(v)
                        g = str(getattr(v, "gender", "")).lower()
                        if ("male" in g) or any(m in name for m in male_name_hints):
                            male_candidates.append(v)
                if male_candidates:
                    selected_voice_id = male_candidates[0].id
                elif any_candidates:
                    selected_voice_id = any_candidates[0].id

                # Second priority: If no Indian voice found, look for language-specific voices
                if not selected_voice_id and language:
                    tl = (language or "").lower()
                    lang_hints: dict[str, list[str]] = {
                        "hi": ["hindi", "india", "ravi", "heera"],
                        "hindi": ["hindi", "india", "ravi", "heera"],
                        "ta": ["tamil", "india"],
                        "tamil": ["tamil", "india"],
                        "te": ["telugu", "india"],
                        "telugu": ["telugu", "india"],
                        "mr": ["marathi", "india"],
                        "marathi": ["marathi", "india"],
                        "gu": ["gujarati", "india"],
                        "gujarati": ["gujarati", "india"],
                        "en": ["india", "indian", "ravi", "heera", "english"],
                        "english": ["india", "indian", "ravi", "heera", "english"],
                    }
                    hints = lang_hints.get(tl)
                    if not hints and "-" in tl:
                        hints = lang_hints.get(tl.split("-", 1)[0])
                    if hints:
                        male_name_hints = [
                            "ravi", "heera", "prabhat", "madhur", "valluvar", "mohan",
                            "bashkar", "niranjan", "manohar", "gagan", "midhun", "gurpreet",
                        ]
                        male_candidates = []
                        any_candidates = []
                        for v in voices:
                            name = (getattr(v, "name", "") or "").lower()
                            if any(h in name for h in hints):
                                any_candidates.append(v)
                                g = str(getattr(v, "gender", "")).lower()
                                if ("male" in g) or any(m in name for m in male_name_hints):
                                    male_candidates.append(v)
                        if male_candidates:
                            selected_voice_id = male_candidates[0].id
                        elif any_candidates:
                            selected_voice_id = any_candidates[0].id

            if selected_voice_id:
                self.engine.setProperty("voice", selected_voice_id)
            if rate:
                self.engine.setProperty("rate", rate or 175)  # Default to moderate speed
        else:
            # edge-tts config resolved at synth time
            pass

    def list_voices(self) -> list[dict]:
        if self.provider == "pyttsx3":
            assert self.engine is not None
            voices = self.engine.getProperty("voices") or []
            out: list[dict] = []
            for v in voices:
                out.append({
                    "id": getattr(v, "id", None),
                    "name": getattr(v, "name", None),
                    "languages": [
                        (l.decode("utf-8", "ignore") if isinstance(l, (bytes, bytearray)) else str(l))
                        for l in getattr(v, "languages", [])
                    ] if hasattr(v, "languages") else None,
                    "age": getattr(v, "age", None),
                    "gender": getattr(v, "gender", None),
                })
            return out
        else:
            # minimal static recommended Edge Indian voices (male only)
            return [
                {"id": None, "name": v, "languages": None, "age": None, "gender": None}
                for v in [
                    "hi-IN-MadhurNeural",
                    "en-IN-PrabhatNeural",
                    "ta-IN-ValluvarNeural",
                    "te-IN-MohanNeural",
                    "bn-IN-BashkarNeural",
                    "gu-IN-NiranjanNeural",
                    "mr-IN-ManoharNeural",
                    "kn-IN-GaganNeural",
                    "ml-IN-MidhunNeural",
                    "pa-IN-GurpreetNeural",
                ]
            ]

    async def synthesize(self, text: str) -> Tuple[str, int, str]:
        """
        Synthesize text to an audio file.

        Returns (path, duration_ms| -1 if unknown, mime_type)
        """
        if self.provider == "pyttsx3":
            assert self.engine is not None
            fd, path = tempfile.mkstemp(suffix=".wav", prefix="ganesha_tts_")
            os.close(fd)
            def _synthesize_blocking() -> None:
                self.engine.save_to_file(text, path)
                self.engine.runAndWait()
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _synthesize_blocking)
            return path, -1, "audio/wav"
        # Edge provider
        if edge_tts is None:
            raise RuntimeError("edge-tts not installed; set TTS_PROVIDER=pyttsx3 or install edge-tts")
        voice = self._resolve_edge_voice(self._language, self._voice)
        rate_pct = self._map_rate_to_edge(self._rate)
        fd, path = tempfile.mkstemp(suffix=".mp3", prefix="ganesha_tts_")
        os.close(fd)
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_pct)
        await communicate.save(path)
        return path, -1, "audio/mpeg"

    def _resolve_edge_voice(self, language: Optional[str], explicit_voice: Optional[str]) -> str:
        if explicit_voice:
            # Only allow explicit male voices
            male_voices = {
                "hi-IN-MadhurNeural",
                "en-IN-PrabhatNeural",
                "ta-IN-ValluvarNeural",
                "te-IN-MohanNeural",
                "bn-IN-BashkarNeural",
                "gu-IN-NiranjanNeural",
                "mr-IN-ManoharNeural",
                "kn-IN-GaganNeural",
                "ml-IN-MidhunNeural",
                "pa-IN-GurpreetNeural",
            }
            if explicit_voice in male_voices:
                return explicit_voice
        lang = (language or "en").lower()
        if "-" in lang:
            lang = lang.split("-", 1)[0]
        mapping = {
            "hi": "hi-IN-MadhurNeural",
            "ta": "ta-IN-ValluvarNeural",
            "te": "te-IN-MohanNeural",
            "bn": "bn-IN-BashkarNeural",
            "gu": "gu-IN-NiranjanNeural",
            "mr": "mr-IN-ManoharNeural",
            "kn": "kn-IN-GaganNeural",
            "ml": "ml-IN-MidhunNeural",
            "pa": "pa-IN-GurpreetNeural",
            "en": "en-IN-PrabhatNeural",
        }
        return mapping.get(lang, "en-IN-PrabhatNeural")

    def _map_rate_to_edge(self, rate: Optional[int]) -> str:
        if not rate:
            return "+0%"
        baseline = 175.0
        pct = int(max(-50, min(100, round((rate - baseline) / baseline * 100))))
        sign = "+" if pct >= 0 else ""
        return f"{sign}{pct}%"

    def close(self):
        try:
            if self.engine is not None:
                self.engine.stop()
        except Exception:
            pass
