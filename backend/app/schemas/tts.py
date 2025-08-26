from typing import Optional
from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: Optional[str] = None
    voice: Optional[str] = Field(None, description="Voice name or identifier. Uses system voices if available.")
    rate: Optional[int] = Field(None, description="Words-per-minute or engine-specific rate")

