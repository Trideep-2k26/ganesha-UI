from typing import Any, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    text: str = Field(..., min_length=1, description="User's input text")
    language: Optional[str] = Field(None, description="ISO language code of the user's input (optional)")
    temperature: float = Field(0.6, ge=0.0, le=2.0)
    context: Optional[dict[str, Any]] = Field(
        default=None,
        description="Optional structured context about the booth, user session, or prior turns",
    )
    history: Optional[list[dict[str, str]]] = Field(
        default=None,
        description=(
            "Optional prior messages to provide conversation continuity. "
            "Each item should be a dict with 'role' ('user'|'assistant') and 'content' (str)."
        ),
    )


class ChatResponse(BaseModel):
    text: str
    language: str
    safety_flags: list[str] = []
    meta: dict[str, Any] = {}
