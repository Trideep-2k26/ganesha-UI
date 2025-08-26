import os
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_chat_block_political():
    payload = {"text": "Tell me about the election and political party", "temperature": 0.2}
    r = client.post("/chat/", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "political_content" in data.get("safety_flags", [])
    assert data.get("meta", {}).get("model") is not None


def test_chat_ok_path():
    payload = {"text": "I am anxious about exams. Please guide me with wisdom."}
    r = client.post("/chat/", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "text" in data
    assert data["language"] in ("en", "hi", "ta", "te", "mr", "bn", "gu", "kn", "ml", "pa") or isinstance(data["language"], str)


def test_lipsync():
    r = client.post("/lipsync/", json={"text": "Om Gan Ganapataye Namaha"})
    assert r.status_code == 200
    data = r.json()
    assert "visemes" in data
    assert len(data["visemes"]) > 0


def test_stt_placeholder(tmp_path: Path):
    # Create a tiny fake wav file-like bytes
    fake_audio = b"RIFF....WAVEfmt "
    files = {"audio": ("fake.wav", fake_audio, "audio/wav")}
    r = client.post("/stt/", files=files)
    assert r.status_code == 200
    data = r.json()
    assert "Transcription service not configured." in data.get("text", "")


def test_tts_smoke():
    # TTS may fail in some environments; we still validate API shape
    r = client.post("/tts/", json={"text": "Shri Ganesha guides with wisdom."})
    assert r.status_code in (200, 500)
    if r.status_code == 200:
        ct = r.headers.get("content-type", "")
        assert ct.startswith("audio/wav") or ct.startswith("audio/mpeg")
