import os
import re
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

EVAL_DIR = Path(__file__).resolve().parent.parent.parent / "eval"
PAIRS_PATH = EVAL_DIR / "pairs.json"
RESULTS_PATH = EVAL_DIR / "results.json"
UNANSWERABLE_PATH = EVAL_DIR / "unanswerable.json"

NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20"
}

def normalize_answer(text: str) -> str:
    """Normalize answer: lowercase, strip punctuation, strip articles, convert number words."""
    if not text:
        return ""
    text = text.lower().strip()
    # Strip punctuation
    text = re.sub(r"[^\w\s]", "", text)
    tokens = text.split()
    # Strip articles (a, an, the)
    tokens = [t for t in tokens if t not in {"a", "an", "the"}]
    # Convert number words
    tokens = [NUMBER_WORDS.get(t, t) for t in tokens]
    return " ".join(tokens).strip()

class EvalService:
    def __init__(self):
        self._st_model = None

    def get_st_model(self):
        """Lazy load all-MiniLM-L6-v2."""
        if self._st_model is None:
            # Ensure USE_TF=0 for compatibility
            os.environ["USE_TF"] = "0"
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer("all-MiniLM-L6-v2")
            except (ImportError, Exception) as e:
                logger.info(f"sentence_transformers not available in this environment: {e}")
                return None
        return self._st_model

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """Compute cosine similarity between two texts using all-MiniLM-L6-v2, or fallback to token similarity."""
        try:
            model = self.get_st_model()
            if model is not None:
                embeddings = model.encode([text_a, text_b], normalize_embeddings=True)
                cos_sim = float(np.dot(embeddings[0], embeddings[1]))
                return max(0.0, min(1.0, cos_sim))
        except Exception as e:
            logger.warning(f"Embedding similarity failed: {e}")
            # Fallback to token Jaccard similarity
            tokens_a = set(normalize_answer(text_a).split())
            tokens_b = set(normalize_answer(text_b).split())
            if not tokens_a or not tokens_b:
                return 0.0
            return len(tokens_a & tokens_b) / len(tokens_a | tokens_b)

    def evaluate_prediction(
        self, prediction: str, ground_truth: str, alternates: List[str], threshold: float = 0.80
    ) -> Tuple[bool, float, str]:
        """Evaluates prediction against ground truth and alternates.
        Returns (is_correct, similarity_score, match_type).
        """
        norm_pred = normalize_answer(prediction)
        norm_gt = normalize_answer(ground_truth)
        norm_alts = [normalize_answer(alt) for alt in alternates]

        # 1. Rule-based exact match
        if norm_pred and (norm_pred == norm_gt or norm_pred in norm_alts):
            return True, 1.0, "exact_match"

        # 2. Substring match for compound answers
        if norm_gt and (norm_pred in norm_gt.split() or norm_gt in norm_pred.split()):
            return True, 0.90, "token_match"

        # 3. Semantic similarity check via MiniLM
        max_sim = self.compute_similarity(prediction, ground_truth)
        for alt in alternates:
            sim = self.compute_similarity(prediction, alt)
            if sim > max_sim:
                max_sim = sim

        if max_sim >= threshold:
            return True, round(max_sim, 4), "semantic_similarity"

        return False, round(max_sim, 4), "mismatch"

    def load_pairs(self) -> List[Dict[str, Any]]:
        """Load 20 core evaluation pairs."""
        if not PAIRS_PATH.exists():
            return []
        with open(PAIRS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_results(self) -> Dict[str, Any]:
        """Load stored evaluation results and overrides."""
        if not RESULTS_PATH.exists():
            return {}
        with open(RESULTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    def save_results(self, data: Dict[str, Any]) -> None:
        """Persist evaluation results to results.json."""
        with open(RESULTS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def compute_summary_metrics(self, runs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute aggregate benchmark metrics, calibration stats, and latency breakdown."""
        if not runs:
            return {}

        total = len(runs)
        correct_count = sum(1 for r in runs if r.get("verdict", False))
        accuracy = round((correct_count / total) * 100, 2) if total else 0.0

        # Per category metrics
        categories = {}
        for r in runs:
            cat = r.get("category", "unknown")
            if cat not in categories:
                categories[cat] = {"total": 0, "correct": 0, "latencies": []}
            categories[cat]["total"] += 1
            if r.get("verdict", False):
                categories[cat]["correct"] += 1
            categories[cat]["latencies"].append(r.get("latency_ms", 0))

        cat_summary = {}
        for cat, val in categories.items():
            tot = val["total"]
            corr = val["correct"]
            acc = round((corr / tot) * 100, 2) if tot else 0.0
            avg_lat = round(sum(val["latencies"]) / tot, 1) if tot else 0.0
            cat_summary[cat] = {
                "total": tot,
                "correct": corr,
                "accuracy": acc,
                "mean_latency_ms": avg_lat
            }

        # Calibration: mean confidence of correct vs incorrect
        correct_confs = [r.get("confidence", 0.0) for r in runs if r.get("verdict", False)]
        incorrect_confs = [r.get("confidence", 0.0) for r in runs if not r.get("verdict", False)]

        mean_correct_conf = round(float(np.mean(correct_confs)), 4) if correct_confs else 0.0
        mean_incorrect_conf = round(float(np.mean(incorrect_confs)), 4) if incorrect_confs else 0.0
        mean_latency = round(float(np.mean([r.get("latency_ms", 0) for r in runs])), 1)

        return {
            "total_pairs": total,
            "correct": correct_count,
            "overall_accuracy": accuracy,
            "mean_latency_ms": mean_latency,
            "calibration": {
                "mean_correct_confidence": mean_correct_conf,
                "mean_incorrect_confidence": mean_incorrect_conf,
                "confidence_gap": round(mean_correct_conf - mean_incorrect_conf, 4)
            },
            "by_category": cat_summary
        }

    def generate_results_markdown(self, data: Dict[str, Any]) -> str:
        """Generates RESULTS.md table content ready to paste into report."""
        summary = data.get("summary", {})
        pairs_eval = data.get("pairs", [])
        engine = data.get("engine", "BLIP")

        md = []
        md.append(f"# Visual Question Answering — Benchmark Evaluation Results\n")
        md.append(f"**Evaluated Engine:** {engine.upper()}  ")
        md.append(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}  ")
        md.append(f"**Overall Accuracy:** {summary.get('overall_accuracy', 0)}% ({summary.get('correct', 0)}/{summary.get('total_pairs', 0)})  ")
        md.append(f"**Mean Latency:** {summary.get('mean_latency_ms', 0)} ms  ")
        calib = summary.get("calibration", {})
        md.append(f"**Confidence Calibration:** Correct = {calib.get('mean_correct_confidence', 0)} vs Incorrect = {calib.get('mean_incorrect_confidence', 0)} (Gap = {calib.get('confidence_gap', 0)})\n")

        md.append("## Category Breakdown\n")
        md.append("| Category | Total Pairs | Correct | Accuracy (%) | Mean Latency (ms) |")
        md.append("| :--- | :---: | :---: | :---: | :---: |")
        for cat, cdata in summary.get("by_category", {}).items():
            md.append(f"| **{cat.capitalize()}** | {cdata['total']} | {cdata['correct']} | {cdata['accuracy']}% | {cdata['mean_latency_ms']} ms |")

        md.append("\n## Detailed Predictions & Overrides\n")
        md.append("| ID | Category | Question | Ground Truth | Prediction | Conf | Verdict | Reason / Notes |")
        md.append("| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |")
        for p in pairs_eval:
            v_badge = "✅ Pass" if p.get("verdict") else "❌ Fail"
            notes = p.get("failure_reason", "") or p.get("notes", "") or "-"
            md.append(
                f"| {p.get('id')} | {p.get('category')} | {p.get('question')} | "
                f"`{p.get('ground_truth')}` | `{p.get('prediction')}` | "
                f"{p.get('confidence', 0.0):.2f} | {v_badge} | {notes} |"
            )

        return "\n".join(md)

    def generate_results_csv(self, data: Dict[str, Any]) -> str:
        """Generates CSV string of results."""
        pairs_eval = data.get("pairs", [])
        lines = ["id,category,question,ground_truth,prediction,confidence,verdict,match_type,failure_reason,notes"]
        for p in pairs_eval:
            q = f'"{p.get("question", "")}"'
            gt = f'"{p.get("ground_truth", "")}"'
            pred = f'"{p.get("prediction", "")}"'
            lines.append(
                f"{p.get('id')},{p.get('category')},{q},{gt},{pred},"
                f"{p.get('confidence', 0.0)},{p.get('verdict', False)},"
                f"{p.get('match_type', '')},{p.get('failure_reason', '')},\"{p.get('notes', '')}\""
            )
        return "\n".join(lines)

eval_service = EvalService()
