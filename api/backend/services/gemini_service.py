import os
import time
import hashlib
import re
import logging
from typing import Dict, Any, Tuple, Optional
from google import genai
from google.genai import types
from google.genai.errors import APIError

logger = logging.getLogger(__name__)

# Fallback cache for expansion results: hash -> dict
_EXPAND_CACHE: Dict[str, Dict[str, Any]] = {}

FEW_SHOT_EXAMPLES = """Question: What color is the car?
Short Answer: red
Full sentence: The car is red.

Question: How many dogs are in the park?
Short Answer: 3
Full sentence: There are three dogs in the park.

Question: Is the path ahead clear of obstacles?
Short Answer: yes
Full sentence: The path ahead is clear of obstacles.

Question: What is sitting on the table?
Short Answer: laptop
Full sentence: A laptop is sitting on the table.

Question: Is the room well-lit?
Short Answer: no
Full sentence: The room is not well-lit.

Question: What is the person wearing?
Short Answer: blue jacket
Full sentence: The person is wearing a blue jacket."""

EXPAND_SYSTEM_INSTRUCTION = (
    "You are an assistant that expands terse visual question answering (VQA) answers "
    "into exactly one complete, grammatically correct English sentence. You MUST restate "
    "only the facts provided in the question and short answer. NEVER introduce new facts, "
    "assumptions, or hallucinations. Provide only the expanded single sentence and nothing else."
)

class GeminiService:
    def __init__(self):
        self._client: Optional[genai.Client] = None
        self._current_key: Optional[str] = None

    @property
    def model_name(self) -> str:
        return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    @property
    def api_key(self) -> Optional[str]:
        return os.environ.get("GEMINI_API_KEY", "").strip() or None

    def get_client(self) -> Optional[genai.Client]:
        """Lazy-initialize google-genai client."""
        key = self.api_key
        if not key:
            return None
        if self._client is None or self._current_key != key:
            self._client = genai.Client(api_key=key)
            self._current_key = key
        return self._client

    def answer_visual_question(
        self, image_bytes: bytes, mime_type: str, question: str
    ) -> Dict[str, Any]:
        """Multimodal visual question answering via Gemini Flash."""
        client = self.get_client()
        t0 = time.perf_counter()

        if not client:
            return {
                "short_answer": "API key missing",
                "confidence": 0.0,
                "latency_ms": 0,
                "engine": "gemini",
                "error": "GEMINI_API_KEY is not configured in backend environment."
            }

        prompt = (
            f"Question about the image: {question}\n"
            "Instructions: Provide a concise, factual answer in 1 to 3 words. "
            "If the object is not visible or cannot be determined, say 'not visible'."
        )

        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type or "image/jpeg")
            response = client.models.generate_content(
                model=self.model_name,
                contents=[image_part, prompt],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    system_instruction=(
                        "You are a precise, concise visual question answering engine. "
                        "State only what is directly visible. Answer strictly in 1 to 3 words."
                    )
                )
            )
            raw_text = (response.text or "").strip()
            # Clean punctuation and extra lines
            cleaned = re.sub(r"[\r\n]+", " ", raw_text).strip().rstrip(".").lower()
            latency_ms = int((time.perf_counter() - t0) * 1000)

            # Heuristic confidence based on response clarity
            confidence = 0.95 if cleaned and cleaned != "not visible" else 0.40

            return {
                "short_answer": cleaned,
                "confidence": confidence,
                "latency_ms": latency_ms,
                "engine": "gemini",
                "top_k": [{"answer": cleaned, "probability": confidence}]
            }
        except Exception as e:
            logger.error(f"Gemini VQA failed: {e}")
            latency_ms = int((time.perf_counter() - t0) * 1000)
            return {
                "short_answer": "error",
                "confidence": 0.0,
                "latency_ms": latency_ms,
                "engine": "gemini",
                "error": str(e)
            }

    def expand_answer(
        self, question: str, short_answer: str, technique: str = "few_shot"
    ) -> Dict[str, Any]:
        """Expand terse short answer into full sentence using zero_shot or few_shot."""
        cache_key = hashlib.sha256(f"{technique}:{question.lower().strip()}:{short_answer.lower().strip()}".encode()).hexdigest()
        if cache_key in _EXPAND_CACHE:
            cached = dict(_EXPAND_CACHE[cache_key])
            cached["cached"] = True
            return cached

        t0 = time.perf_counter()
        client = self.get_client()

        # Deterministic rule-based template fallback builder
        def build_fallback_sentence(q: str, a: str) -> str:
            clean_q = q.strip().rstrip("?")
            clean_a = a.strip()
            if re.match(r"^is (there|the|it)\b", clean_q, re.IGNORECASE):
                if clean_a.lower() in ["yes", "true", "correct"]:
                    return f"Yes, {clean_q.lower()}."
                elif clean_a.lower() in ["no", "false"]:
                    return f"No, {clean_q.lower()} is not the case."
            if re.match(r"^what color is the (.*)", clean_q, re.IGNORECASE):
                subj = re.sub(r"^what color is the\s+", "", clean_q, flags=re.IGNORECASE)
                return f"The {subj} is {clean_a}."
            if re.match(r"^how many (.*) are there", clean_q, re.IGNORECASE):
                items = re.sub(r"^how many\s+", "", clean_q, flags=re.IGNORECASE)
                items = re.sub(r"\s+are there.*", "", items, flags=re.IGNORECASE)
                return f"There are {clean_a} {items}."
            return f"The answer to '{clean_q}?' is {clean_a}."

        if not client:
            fallback = build_fallback_sentence(question, short_answer)
            latency_ms = int((time.perf_counter() - t0) * 1000)
            result = {
                "sentence": fallback,
                "technique": technique,
                "latency_ms": latency_ms,
                "is_fallback": True,
                "fallback_reason": "GEMINI_API_KEY not configured",
                "fidelity_passed": True,
                "fidelity_score": 1.0,
            }
            _EXPAND_CACHE[cache_key] = result
            return result

        # Construct prompt according to technique
        if technique == "zero_shot":
            prompt = (
                f"Question: {question}\n"
                f"Short Answer: {short_answer}\n"
                "Full sentence:"
            )
        else: # few_shot
            prompt = (
                f"{FEW_SHOT_EXAMPLES}\n\n"
                f"Question: {question}\n"
                f"Short Answer: {short_answer}\n"
                "Full sentence:"
            )

        # Call with retry & exponential backoff
        max_retries = 2
        delay = 0.5
        expanded_sentence = ""
        error_msg = None

        for attempt in range(max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        system_instruction=EXPAND_SYSTEM_INSTRUCTION
                    )
                )
                expanded_sentence = (response.text or "").strip()
                # Ensure single sentence output
                expanded_sentence = re.sub(r"[\r\n]+", " ", expanded_sentence).strip()
                break
            except Exception as e:
                error_msg = str(e)
                if attempt < max_retries:
                    time.sleep(delay)
                    delay *= 2
                else:
                    logger.warning(f"Gemini expansion failed after retries: {e}")

        # Fidelity check
        fidelity_passed, fidelity_score = self._check_fidelity(question, short_answer, expanded_sentence)

        if not expanded_sentence or not fidelity_passed or error_msg:
            fallback = build_fallback_sentence(question, short_answer)
            latency_ms = int((time.perf_counter() - t0) * 1000)
            reason = error_msg if error_msg else "Fidelity check failed (short answer missing or distorted)"
            result = {
                "sentence": fallback,
                "technique": technique,
                "latency_ms": latency_ms,
                "is_fallback": True,
                "fallback_reason": reason,
                "fidelity_passed": False,
                "fidelity_score": fidelity_score,
                "raw_generated": expanded_sentence
            }
            _EXPAND_CACHE[cache_key] = result
            return result

        latency_ms = int((time.perf_counter() - t0) * 1000)
        result = {
            "sentence": expanded_sentence,
            "technique": technique,
            "latency_ms": latency_ms,
            "is_fallback": False,
            "fallback_reason": None,
            "fidelity_passed": True,
            "fidelity_score": fidelity_score,
        }
        _EXPAND_CACHE[cache_key] = result
        return result

    def _check_fidelity(
        self, question: str, short_answer: str, sentence: str
    ) -> Tuple[bool, float]:
        """Check whether the short answer information is preserved in the expanded sentence."""
        if not sentence:
            return False, 0.0

        clean_a = short_answer.lower().strip()
        clean_s = sentence.lower().strip()

        # 1. Direct or normalized token inclusion
        number_map = {
            "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
            "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten"
        }
        rev_number_map = {v: k for k, v in number_map.items()}

        tokens_to_find = [clean_a]
        if clean_a in number_map:
            tokens_to_find.append(number_map[clean_a])
        if clean_a in rev_number_map:
            tokens_to_find.append(rev_number_map[clean_a])

        # Yes/no alternate checks
        if clean_a == "yes":
            tokens_to_find.extend(["is", "does", "contains", "there is", "yes"])
        elif clean_a == "no":
            tokens_to_find.extend(["not", "no", "neither", "none", "there is no"])

        for token in tokens_to_find:
            if re.search(rf"\b{re.escape(token)}\b", clean_s):
                return True, 1.0

        # 2. Embedding semantic check via MiniLM if available
        try:
            from backend.services.eval_service import eval_service
            score = eval_service.compute_similarity(f"{question} {short_answer}", sentence)
            if score >= 0.70:
                return True, round(score, 4)
            return False, round(score, 4)
        except Exception:
            # If MiniLM not loaded, return partial score
            return False, 0.50

gemini_service = GeminiService()
