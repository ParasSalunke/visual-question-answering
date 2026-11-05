import os
import io
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PIL import Image
from dotenv import load_dotenv

# Load local environment variables from .env
load_dotenv()

# Ensure TF doesn't interfere with PyTorch
os.environ["USE_TF"] = "0"

from backend.services.guardrails import (
    validate_image_bytes,
    validate_question,
    check_rate_limit,
)
from backend.services.blip_service import blip_service
from backend.services.gemini_service import gemini_service
from backend.services.image_gen_service import image_gen_service, HARD_CASE_PRESETS
from backend.services.eval_service import eval_service, EVAL_DIR, PAIRS_PATH, RESULTS_PATH, UNANSWERABLE_PATH

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("vqa-app")

app = FastAPI(
    title="Visual Question Answering App",
    description="Multimodal VQA platform combining Salesforce BLIP-VQA with Gemini Flash LLM expansion and comprehensive academic evaluation.",
    version="1.0.0",
)

# CORS configuration for Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class ExpandRequest(BaseModel):
    question: str
    short_answer: str
    technique: Optional[str] = "few_shot"  # "zero_shot", "few_shot", or "both"

class GenerateRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None

class EvalRunRequest(BaseModel):
    engine: str = "blip"  # "blip" or "gemini"
    threshold: float = 0.80

class OverrideUpdateRequest(BaseModel):
    id: str
    verdict: bool
    failure_reason: Optional[str] = None
    notes: Optional[str] = None

# ----------------- Core API Endpoints ----------------- #

@app.get("/api/health")
async def health():
    """Health check endpoint indicating model and provider availability."""
    gemini_key_present = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    hf_token_present = bool(os.environ.get("HF_TOKEN", "").strip())
    
    low_mem = os.environ.get("LOW_MEMORY_MODE", "false").lower() in ("true", "1", "yes")
    return {
        "status": "healthy",
        "blip_loaded": blip_service._is_loaded,
        "low_memory_mode": low_mem,
        "gemini_configured": gemini_key_present,
        "hf_configured": hf_token_present,
        "gemini_model": os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
        "image_provider": os.environ.get("IMAGE_PROVIDER", "hf"),
    }

@app.get("/api/templates")
async def get_templates():
    """Returns curated question templates across 8 categories."""
    templates_file = Path(__file__).parent / "templates.json"
    if not templates_file.exists():
        raise HTTPException(status_code=404, detail="templates.json not found")
    with open(templates_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/api/presets")
async def get_presets():
    """Returns hard-case presets for Test Image Lab."""
    return HARD_CASE_PRESETS

@app.post("/api/vqa")
async def answer_vqa(
    request: Request,
    image: UploadFile = File(...),
    question: str = Form(...),
    engine: str = Form("blip"),
):
    """Core VQA inference endpoint: processes uploaded image in memory and answers the question.
    Engine can be 'blip', 'gemini', or 'both'.
    """
    check_rate_limit(request)
    
    # Validate question guardrails
    is_valid_q, q_err = validate_question(question)
    if not is_valid_q:
        raise HTTPException(status_code=400, detail=q_err)

    # Read and validate image in memory (never written to permanent disk storage)
    image_bytes = await image.read()
    validate_image_bytes(image_bytes)

    try:
        pil_image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {e}")

    results = {}

    if engine in ["blip", "both"]:
        try:
            blip_res = blip_service.answer_question(pil_image, question)
            results["blip"] = blip_res
        except Exception as e:
            logger.error(f"BLIP VQA error: {e}")
            results["blip"] = {
                "short_answer": "error",
                "confidence": 0.0,
                "latency_ms": 0,
                "error": str(e),
                "engine": "blip",
            }

    if engine in ["gemini", "both"]:
        gemini_res = gemini_service.answer_visual_question(
            image_bytes=image_bytes,
            mime_type=image.content_type or "image/jpeg",
            question=question,
        )
        results["gemini"] = gemini_res

    # Provide default root level response mapping for single engine call
    primary_engine = "blip" if engine != "gemini" else "gemini"
    primary_data = results.get(primary_engine, {})

    return {
        "short_answer": primary_data.get("short_answer", ""),
        "confidence": primary_data.get("confidence", 0.0),
        "latency_ms": primary_data.get("latency_ms", 0),
        "top_k": primary_data.get("top_k", []),
        "engine": engine,
        "details": results,
        "is_low_confidence": primary_data.get("confidence", 0.0) < 0.45,
    }

@app.post("/api/expand")
async def expand_answer(request: Request, body: ExpandRequest):
    """Expands terse short answer into full sentence using Gemini with fidelity check."""
    check_rate_limit(request)

    if not body.question.strip() or not body.short_answer.strip():
        raise HTTPException(status_code=400, detail="Both question and short_answer are required.")

    if body.technique == "both":
        res_zero = gemini_service.expand_answer(body.question, body.short_answer, technique="zero_shot")
        res_few = gemini_service.expand_answer(body.question, body.short_answer, technique="few_shot")
        return {
            "zero_shot": res_zero,
            "few_shot": res_few,
            "sentence": res_few.get("sentence", ""),
            "technique": "both"
        }
    else:
        res = gemini_service.expand_answer(body.question, body.short_answer, technique=body.technique or "few_shot")
        return res

@app.post("/api/generate")
async def generate_image(request: Request, body: GenerateRequest):
    """Generates hard-case image for Test Image Lab using HF sd-turbo or Gemini Image."""
    check_rate_limit(request)
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    
    result = image_gen_service.generate_image(body.prompt, requested_provider=body.provider)
    return result

# ----------------- Evaluation Endpoints ----------------- #

@app.get("/api/eval/pairs")
async def get_eval_pairs():
    """Returns 20 benchmark pairs."""
    return eval_service.load_pairs()

@app.post("/api/eval/run")
async def run_evaluation(body: EvalRunRequest):
    """Executes automated benchmark evaluation on all 20 pairs for the given engine."""
    pairs = eval_service.load_pairs()
    if not pairs:
        raise HTTPException(status_code=404, detail="Evaluation pairs not found in eval/pairs.json")

    runs = []
    base_dir = Path(__file__).resolve().parent.parent

    for item in pairs:
        img_rel = item.get("image")
        img_path = base_dir / img_rel
        q = item.get("question")
        gt = item.get("ground_truth", "")
        alts = item.get("acceptable_alternates", [])
        cat = item.get("category", "normal")

        if not img_path.exists():
            logger.warning(f"Benchmark image {img_path} not found")
            continue

        try:
            with Image.open(img_path) as pil_img:
                if body.engine == "gemini":
                    with open(img_path, "rb") as f:
                        raw_bytes = f.read()
                    ext = img_path.suffix.lstrip(".").lower()
                    mime = f"image/{ext}" if ext in ["jpeg", "jpg", "png", "webp"] else "image/jpeg"
                    ans_data = gemini_service.answer_visual_question(raw_bytes, mime, q)
                else:
                    ans_data = blip_service.answer_question(pil_img, q)

                pred = ans_data.get("short_answer", "")
                conf = ans_data.get("confidence", 0.0)
                lat = ans_data.get("latency_ms", 0)

                is_correct, sim_score, match_type = eval_service.evaluate_prediction(
                    prediction=pred, ground_truth=gt, alternates=alts, threshold=body.threshold
                )

                runs.append({
                    "id": item.get("id"),
                    "image": item.get("image"),
                    "question": q,
                    "ground_truth": gt,
                    "acceptable_alternates": alts,
                    "prediction": pred,
                    "confidence": conf,
                    "latency_ms": lat,
                    "category": cat,
                    "source": item.get("source", "real"),
                    "verdict": is_correct,
                    "auto_verdict": is_correct,
                    "similarity_score": sim_score,
                    "match_type": match_type,
                    "failure_reason": "" if is_correct else (
                        "too dark" if cat == "low_light" else ("clutter" if cat == "cluttered" else "misclassification")
                    ),
                    "notes": "",
                })
        except Exception as e:
            logger.error(f"Error evaluating pair {item.get('id')}: {e}")

    summary = eval_service.compute_summary_metrics(runs)
    eval_data = {
        "engine": body.engine,
        "timestamp": time.time(),
        "summary": summary,
        "pairs": runs,
    }

    eval_service.save_results(eval_data)
    
    # Also write RESULTS.md
    md_content = eval_service.generate_results_markdown(eval_data)
    results_md_path = base_dir / "RESULTS.md"
    with open(results_md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    return eval_data

@app.get("/api/eval/results")
async def get_eval_results():
    """Retrieve saved evaluation results and overrides."""
    data = eval_service.load_results()
    if not data:
        raise HTTPException(status_code=404, detail="No evaluation results found. Run /api/eval/run first.")
    return data

@app.put("/api/eval/results")
async def update_eval_override(body: OverrideUpdateRequest):
    """Allows manual override of verdict or failure notes for a specific pair."""
    data = eval_service.load_results()
    if not data or "pairs" not in data:
        raise HTTPException(status_code=404, detail="No evaluation results to update.")

    updated = False
    for p in data["pairs"]:
        if p.get("id") == body.id:
            p["verdict"] = body.verdict
            p["manual_override"] = True
            if body.failure_reason is not None:
                p["failure_reason"] = body.failure_reason
            if body.notes is not None:
                p["notes"] = body.notes
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail=f"Pair with id {body.id} not found.")

    # Recompute summary metrics
    data["summary"] = eval_service.compute_summary_metrics(data["pairs"])
    eval_service.save_results(data)

    # Update RESULTS.md
    base_dir = Path(__file__).resolve().parent.parent
    md_content = eval_service.generate_results_markdown(data)
    with open(base_dir / "RESULTS.md", "w", encoding="utf-8") as f:
        f.write(md_content)

    return data

@app.get("/api/eval/export/csv")
async def export_results_csv():
    """Exports benchmark results as CSV."""
    data = eval_service.load_results()
    if not data:
        raise HTTPException(status_code=404, detail="No results found.")
    csv_str = eval_service.generate_results_csv(data)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"}
    )

@app.get("/api/eval/unanswerable")
async def get_unanswerable():
    """Returns 10 questions about items NOT present in images for hallucination testing."""
    if not UNANSWERABLE_PATH.exists():
        return []
    with open(UNANSWERABLE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/api/eval/unanswerable/run")
async def run_unanswerable_test(engine: str = "blip"):
    """Evaluates hallucination rate on unanswerable questions."""
    if not UNANSWERABLE_PATH.exists():
        raise HTTPException(status_code=404, detail="unanswerable.json not found")
    with open(UNANSWERABLE_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    base_dir = Path(__file__).resolve().parent.parent
    results = []
    hallucination_count = 0

    for item in items:
        img_path = base_dir / item.get("image")
        q = item.get("question")
        if not img_path.exists():
            continue

        try:
            with Image.open(img_path) as pil_img:
                if engine == "gemini":
                    with open(img_path, "rb") as f:
                        raw_bytes = f.read()
                    ans_data = gemini_service.answer_visual_question(raw_bytes, "image/jpeg", q)
                else:
                    ans_data = blip_service.answer_question(pil_img, q)

            pred = ans_data.get("short_answer", "").lower()
            conf = ans_data.get("confidence", 0.0)

            # A hallucination occurs if the model confidently asserts an answer rather than 'no', 'not visible', 'none'
            refusal_tokens = {"no", "not visible", "none", "nothing", "zero", "0", "not present", "false"}
            is_refusal = any(tok in pred for tok in refusal_tokens) or pred == ""
            is_hallucination = not is_refusal and conf >= 0.40

            if is_hallucination:
                hallucination_count += 1

            results.append({
                "id": item.get("id"),
                "image": item.get("image"),
                "question": q,
                "prediction": pred,
                "confidence": conf,
                "is_hallucination": is_hallucination,
            })
        except Exception as e:
            logger.error(f"Unanswerable test error on {item.get('id')}: {e}")

    total = len(results)
    rate = round((hallucination_count / total) * 100, 2) if total else 0.0

    return {
        "engine": engine,
        "total_unanswerable": total,
        "hallucinations": hallucination_count,
        "hallucination_rate_pct": rate,
        "items": results,
    }

# ----------------- Serve Frontend in Production ----------------- #
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")

# Static mount for eval images so frontend can render them
eval_images_dir = EVAL_DIR / "images"
if eval_images_dir.exists():
    app.mount("/eval/images", StaticFiles(directory=eval_images_dir), name="eval_images")
