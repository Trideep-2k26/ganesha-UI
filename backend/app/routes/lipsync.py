from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/lipsync", tags=["lipsync"])


class LipSyncRequest(BaseModel):
    text: str = Field(..., min_length=1)


class Viseme(BaseModel):
    time: float
    viseme: str


class LipSyncResponse(BaseModel):
    visemes: list[Viseme]


VOWELS = {
    "A": "a",
    "E": "e",
    "I": "i",
    "O": "o",
    "U": "u",
}


@router.post("/", response_model=LipSyncResponse)
def lipsync(req: LipSyncRequest):
    # extremely naive viseme timing: 8 characters per second
    chars_per_sec = 8.0
    visemes = []
    t = 0.0
    for ch in req.text:
        if ch.strip() == "":
            t += 1.0 / chars_per_sec
            continue
        v = VOWELS.get(ch.upper(), "m")
        visemes.append(Viseme(time=round(t, 3), viseme=v))
        t += 1.0 / chars_per_sec
    return LipSyncResponse(visemes=visemes)
