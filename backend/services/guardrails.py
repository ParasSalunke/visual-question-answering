import time
import re
from typing import Tuple, Dict
from fastapi import HTTPException, Request

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_QUESTION_LENGTH = 200

# Prohibited topics: face recognition/identifying real people, sexual content
DISALLOWED_PATTERNS = [
    re.compile(r"\b(who is this (person|man|woman|girl|boy)|identify (this|the) (person|face|man|woman)|name of this person)\b", re.IGNORECASE),
    re.compile(r"\b(nude|naked|porn|sexual|nsfw|explicit|erotic)\b", re.IGNORECASE),
]

# Simple in-memory rate limiter per IP: IP -> list of timestamps
_RATE_LIMIT_STORE: Dict[str, list[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 60

def validate_image_bytes(image_bytes: bytes) -> None:
    """Validate uploaded image size and non-emptiness."""
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image data provided.")
    if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image size exceeds 5 MB limit ({len(image_bytes) / (1024*1024):.2f} MB)."
        )

def validate_question(question: str) -> Tuple[bool, str]:
    """Validate question length and guardrails against identifying individuals or NSFW content.
    Returns (is_valid, error_or_refusal_message).
    """
    clean_q = (question or "").strip()
    if not clean_q:
        return False, "Question cannot be empty."
    if len(clean_q) > MAX_QUESTION_LENGTH:
        return False, f"Question exceeds maximum allowed length of {MAX_QUESTION_LENGTH} characters."
    
    for pattern in DISALLOWED_PATTERNS:
        if pattern.search(clean_q):
            return False, (
                "Guardrail Refusal: This system is strictly designed for visual question answering "
                "about objects, scenes, and attributes. Requests to identify private individuals from "
                "faces or queries involving sexual/explicit content are blocked under our Responsible AI policy."
            )
    
    return True, ""

def check_rate_limit(request: Request) -> None:
    """In-memory rate limiter per client IP."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = _RATE_LIMIT_STORE.get(client_ip, [])
    
    # Filter out timestamps older than the window
    valid_timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    
    if len(valid_timestamps) >= MAX_REQUESTS_PER_WINDOW:
        _RATE_LIMIT_STORE[client_ip] = valid_timestamps
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: max {MAX_REQUESTS_PER_WINDOW} requests per minute."
        )
    
    valid_timestamps.append(now)
    _RATE_LIMIT_STORE[client_ip] = valid_timestamps
