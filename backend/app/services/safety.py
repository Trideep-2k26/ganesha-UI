from __future__ import annotations
from typing import List
import re

# Simple keyword-based safety checks. In production use a proper moderation service.
OFFENSIVE_TERMS = [
    r"\bidiot\b",
    r"\bstupid\b",
    r"\bhate\b",
    r"\boffend(ing|ed)?\b",
]
POLITICAL_TERMS = [
    r"\belection\b",
    r"\bparty\b",
    r"\bpolitic",
    r"\bcandidate\b",
    r"\bparliament\b",
]


def check_safety(text: str) -> List[str]:
    flags: List[str] = []
    low = text.lower()
    if any(re.search(p, low) for p in OFFENSIVE_TERMS):
        flags.append("offensive_content")
    if any(re.search(p, low) for p in POLITICAL_TERMS):
        flags.append("political_content")
    return flags
