from fastapi import APIRouter, HTTPException
from langdetect import detect
import json

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_client import LLMClient
from app.services.prompts import build_system_prompt
from app.services.safety import check_safety

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    # Determine language
    language = payload.language
    if not language:
        try:
            language = detect(payload.text)
        except Exception:
            language = "en"

    # Initialize LLM client early so we can report model even if we block
    client = LLMClient()

    # Safety check on input
    input_flags = check_safety(payload.text)
    if any(f in input_flags for f in ("offensive_content", "political_content")):
        safe_text = (
            "Mere bacche, main yahan aapko sakaratmak aur prem se margdarshan dene ke liye hun. "
            "Aaiye apni pareshaniyon ko ek sundar tarike se share kariye taki main aapko sahi raah dikha sakun."
        )
        return ChatResponse(
            text=safe_text,
            language=language,
            safety_flags=input_flags,
            meta={"blocked": True, "model": getattr(client, "model", "unknown")},
        )

    # Compose messages for LLM
    system_msg = {"role": "system", "content": build_system_prompt(language)}
    user_msg = {"role": "user", "content": payload.text}

    # Optional structured context -> compact system message
    context_msg = None
    if payload.context:
        context_json = json.dumps(payload.context, ensure_ascii=False)
        context_msg = {"role": "system", "content": f"Additional session context (JSON): {context_json}"}

    # Optional client-provided history (stateless continuity)
    history_msgs = []
    if payload.history:
        # keep only valid roles and non-empty content; limit for latency
        filtered = [m for m in payload.history if isinstance(m, dict) and m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str) and m.get("content")]
        history_msgs = filtered[-8:]  # last N messages for brevity
    used_history_count = len(history_msgs)

    messages = [system_msg]
    if context_msg:
        messages.append(context_msg)
    if history_msgs:
        messages.extend(history_msgs)
    messages.append(user_msg)

    resp = client.chat(messages, temperature=payload.temperature)

    # Parse response safely
    try:
        content = resp["choices"][0]["message"]["content"]
    except Exception:
        raise HTTPException(status_code=502, detail="LLM response parsing failed")

    # Safety check on output
    output_flags = check_safety(content)
    if any(f in output_flags for f in ("offensive_content", "political_content")):
        content = (
            "Main aapko prem aur samman ke saath margdarshan dunga. Ek sundar sujhav hai: "
            "gehri saans lijiye, apni badhaaon ki suchi banaiye, aur unhe dur karne ke liye ek chhota kadam uthayiye."
        )

    return ChatResponse(
        text=content,
        language=language,
        safety_flags=list(set(input_flags + output_flags)),
        meta={
            "model": getattr(client, "model", "unknown"),
            "history_used": used_history_count,
            "context_included": bool(payload.context),
        },
    )
