from __future__ import annotations
import os
import time
import math
import logging
from typing import Dict, Any, List
from PIL import Image

try:
    import torch
    from transformers import BlipProcessor, BlipForQuestionAnswering
    TORCH_AVAILABLE = True
except (ImportError, Exception):
    torch = None
    BlipProcessor = None
    BlipForQuestionAnswering = None
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

# Render Free Tier provides 512MB RAM. Local BLIP-VQA requires ~1.35GB RAM.
# When LOW_MEMORY_MODE is true or Torch is not installed, VQA safely routes to Gemini Vision.
LOW_MEMORY_MODE = os.environ.get("LOW_MEMORY_MODE", "false").lower() in ("true", "1", "yes")

class BlipService:
    def __init__(self, model_id: str = "Salesforce/blip-vqa-base"):
        self.model_id = model_id
        self.processor = None
        self.model = None
        self.device = torch.device("cpu") if torch is not None else None
        self._is_loaded = False

    def load_model(self) -> None:
        """Loads the BLIP-VQA model and processor once in evaluation mode if environment supports it."""
        if not TORCH_AVAILABLE:
            logger.info("Torch/Transformers not installed in this environment; skipping local BLIP loading.")
            return

        if LOW_MEMORY_MODE:
            logger.info("LOW_MEMORY_MODE active: skipping local BLIP loading to conserve memory (<512MB).")
            return

        if self._is_loaded and self.model is not None:
            return
        
        try:
            logger.info(f"Loading BLIP-VQA model: {self.model_id} on CPU...")
            t0 = time.perf_counter()
            self.processor = BlipProcessor.from_pretrained(self.model_id)
            self.model = BlipForQuestionAnswering.from_pretrained(self.model_id)
            self.model.to(self.device)
            self.model.eval()
            self._is_loaded = True
            logger.info(f"BLIP-VQA loaded in {time.perf_counter() - t0:.2f}s")
        except (MemoryError, Exception) as e:
            logger.error(f"Failed to load local BLIP model (likely low memory): {e}")
            self.model = None
            self.processor = None
            self._is_loaded = False

    def answer_question(
        self, image: Image.Image, question: str, top_k: int = 5
    ) -> Dict[str, Any]:
        """Runs VQA on the given PIL image and question string."""
        if not TORCH_AVAILABLE or LOW_MEMORY_MODE or not self._is_loaded:
            self.load_model()

        # If local model is not loaded (due to low memory or missing torch), delegate to Gemini
        if self.model is None or self.processor is None:
            logger.info("Local BLIP not loaded; delegating inference to Gemini Vision cloud engine...")
            from backend.services.gemini_service import gemini_service
            gemini_res = gemini_service.answer_vqa(image, question)
            return {
                "short_answer": gemini_res["short_answer"],
                "confidence": gemini_res["confidence"],
                "top_k": gemini_res.get("top_candidates", [
                    {"answer": gemini_res["short_answer"], "probability": gemini_res["confidence"]}
                ]),
                "latency_ms": gemini_res["latency_ms"],
                "engine": "blip (cloud-mode)",
            }

        t0 = time.perf_counter()

        # Image preprocessing and defensive validation
        if image.mode != "RGB":
            image = image.convert("RGB")
        max_dim = 512
        if max(image.size) > max_dim:
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        inputs = self.processor(images=image, text=question, return_tensors="pt").to(self.device)

        with torch.inference_mode():
            beam_count = max(top_k, 5)
            return_seq_count = min(top_k, 5)

            # Attempt beam search with sequence scores
            try:
                outputs = self.model.generate(
                    **inputs,
                    return_dict_in_generate=True,
                    output_scores=True,
                    num_beams=beam_count,
                    num_return_sequences=return_seq_count,
                    max_new_tokens=15,
                )
                sequences = outputs.sequences
                seq_scores = getattr(outputs, "sequences_scores", None)
            except Exception as e:
                logger.warning(f"Beam search generation failed ({e}), falling back to greedy search")
                outputs = self.model.generate(**inputs, max_new_tokens=15)
                sequences = outputs
                seq_scores = None

            answers: List[str] = []
            for seq in sequences:
                ans = self.processor.decode(seq, skip_special_tokens=True).strip()
                answers.append(ans)

            # Calculate probabilities
            if seq_scores is not None and len(seq_scores) > 0:
                # seq_scores are length-penalized log likelihoods
                # Softmax over beam candidates yields normalized relative probabilities
                probs = torch.softmax(seq_scores[:len(answers)], dim=0).tolist()
            else:
                # Fallback: compute sequence probability with teacher-forced forward pass
                probs = self._compute_teacher_forced_probs(inputs, answers)

            # Deduplicate answers while summing their probabilities
            dedup: Dict[str, float] = {}
            for ans, prob in zip(answers, probs):
                clean_ans = ans.lower().strip()
                dedup[clean_ans] = dedup.get(clean_ans, 0.0) + float(prob)

            sorted_candidates = sorted(
                [{"answer": a, "probability": round(min(1.0, max(0.01, p)), 4)} for a, p in dedup.items()],
                key=lambda x: x["probability"],
                reverse=True,
            )

            # Normalize probabilities to sum to 1.0
            total_p = sum(c["probability"] for c in sorted_candidates) or 1.0
            for c in sorted_candidates:
                c["probability"] = round(c["probability"] / total_p, 4)

            top_answer = sorted_candidates[0]["answer"] if sorted_candidates else ""
            top_confidence = sorted_candidates[0]["probability"] if sorted_candidates else 0.50

            latency_ms = int((time.perf_counter() - t0) * 1000)

            return {
                "short_answer": top_answer,
                "confidence": round(top_confidence, 4),
                "top_k": sorted_candidates[:top_k],
                "latency_ms": latency_ms,
                "engine": "blip",
            }

    def _compute_teacher_forced_probs(
        self, inputs: Dict[str, Any], answers: List[str]
    ) -> List[float]:
        """Compute relative probabilities via teacher-forced cross-entropy when beam scores are absent."""
        if not answers:
            return [1.0]
        try:
            log_probs = []
            for ans in answers:
                labels = self.processor.tokenizer(ans, return_tensors="pt").input_ids.to(self.device)
                fwd_out = self.model(**inputs, labels=labels)
                # loss is negative log likelihood per token
                loss = fwd_out.loss.item()
                # Sequence log prob approx = -loss * seq_len
                seq_len = labels.shape[1]
                log_probs.append(-loss * seq_len)
            tensor_lp = torch.tensor(log_probs)
            return torch.softmax(tensor_lp, dim=0).tolist()
        except Exception as e:
            logger.warning(f"Teacher-forced probability computation error: {e}")
            return [round(1.0 / len(answers), 4)] * len(answers)

# Singleton instance
blip_service = BlipService()
