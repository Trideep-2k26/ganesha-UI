from typing import Optional
from pydantic import BaseModel


class STTResponse(BaseModel):
    text: str
    language: Optional[str] = None
    note: Optional[str] = None
