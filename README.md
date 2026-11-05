---
title: Visual Question Answering App
emoji: 👁️
colorFrom: blue
colorTo: indigo
sdk: gradio
app_file: app.py
pinned: false
---

# Visual Question Answering (VQA) Studio

An end-to-end, multi-model Visual Question Answering (VQA) platform combining classical encoder-decoder vision-language modeling (**Salesforce BLIP-VQA**) with contemporary autoregressive generative LLMs (**Gemini Flash**), embedding-based semantic matching (**all-MiniLM-L6-v2**), adversarial hard-case synthetic generation (**SD-Turbo**), and Responsible AI guardrails.

Built as an individual university Generative AI course project (50 Marks).

---

## 🌟 Key Features

1. **U1 Question Templates**: 26 structured templates across 8 categories (existence, counting, colour, spatial, activity, text/OCR, scene/lighting, accessibility) with dynamic inline placeholder replacement.
2. **U2 LLM Sentence Expansion**: Expands terse 1-3 word vision answers into full, grammatical sentences using Gemini with strict fidelity gating and deterministic syntactic fallback. Side-by-side **Zero-Shot vs Few-Shot (5+ examples)** prompt comparison.
3. **U3 Dual Vision Engine**:
   - **Salesforce BLIP-VQA Base** (local CPU, PyTorch inference mode, sequence beam confidence, top-k answer distribution).
   - **Gemini 2.5 Flash Vision** (cloud multimodal).
   - "Compare Both Engines" side-by-side mode.
   - Web Speech API **"Read Aloud"** text-to-speech & `aria-live` screen-reader announcements.
4. **U4 Test Image Lab**: 6 hard-case adversarial presets (low-light, cluttered, occluded, tiny objects, glare, many-item counting). Downscaling to 512px with interactive "Save to Eval Set" modal.
5. **U5 Benchmark Evaluation & Failure Study**:
   - Automated benchmark over 20 core image-question pairs (8 Normal, 6 Low-Light, 6 Cluttered).
   - Dual-verdict matching: rule-based normalization (digits, punctuation, articles) + MiniLM cosine similarity ($\ge 0.80$).
   - Confidence calibration metric ($+8.4\%$ confidence gap between correct vs incorrect predictions).
   - Failure Gallery with taxonomy tagging (`too dark`, `clutter`, etc.) and student notes for viva defense.
   - One-click CSV and Markdown export.
6. **Layer V Responsible AI**:
   - Measured hallucination rate on 10 unanswerable visual questions.
   - Ephemeral in-memory image processing (zero disk retention).
   - Facial recognition & PII refusal filters.
   - Low-confidence warning banner (< 0.45).

---

## 📊 Benchmark Results (Real Measured CPU Run)

```
=======================================================
BLIP-VQA Benchmark Run (20 Pairs on PyTorch CPU)
=======================================================
Overall Accuracy:           60.0% (12 / 20 correct)
Mean Latency:               612.2 ms per query
Mean Correct Confidence:    43.95%
Mean Incorrect Confidence:  35.57%
Calibration Gap:            +8.38% (healthy confidence separation)

Category Breakdown:
• Normal:                   87.5% (7/8 correct)  |  604.4 ms
• Low-Light:                66.7% (4/6 correct)  |  565.5 ms
• Cluttered:                16.7% (1/6 correct)  |  657.8 ms
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Hash Router.
- **Backend**: FastAPI (Python 3.10/3.11), PyTorch 2.5 (CPU), Transformers 4.48 (`Salesforce/blip-vqa-base`), Sentence-Transformers 3.4 (`all-MiniLM-L6-v2`), `google-genai` SDK, Pillow.
- **Container**: Multi-stage Dockerfile (Node.js 20 Vite builder $\rightarrow$ Python 3.11-slim server on port 7860).

---

## 🚀 Quickstart & Local Setup

### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/visual-question-answering.git
cd visual-question-answering

# Copy environment variables
cp .env.example .env
```

Edit `.env` with your API keys (optional; the app falls back gracefully if keys are omitted):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
HF_TOKEN=your_huggingface_token_here
IMAGE_PROVIDER=hf
PORT=7860
```

### 2. Install Dependencies & Build Frontend
```bash
# Python Virtual Environment
python -m venv --system-site-packages .venv
# Windows: .\.venv\Scripts\pip install -r requirements.txt
# Linux/macOS: source .venv/bin/activate && pip install -r requirements.txt

# Build Frontend
cd frontend
npm install
npm run build
cd ..
```

### 3. Run Backend Server
```bash
# Windows
.\.venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 7860

# Linux/macOS
python -m uvicorn backend.main:app --host 0.0.0.0 --port 7860
```
Open **`http://localhost:7860`** in your browser.

---

## 🧪 Testing

Run the full pytest suite (24 passing unit & integration tests):
```bash
pytest backend/tests/ -v
```

Run the end-to-end smoke test script:
```bash
python scripts/smoke_test.py
```

Run the CLI evaluation benchmark:
```bash
python scripts/run_eval.py blip
```

---

## 🚢 Deploying to Hugging Face Spaces (Docker SDK)

See detailed step-by-step instructions in [`DEPLOY.md`](./DEPLOY.md).
1. Create a new Space on [Hugging Face](https://huggingface.co/new-space).
2. Select **Docker SDK** (Blank template).
3. Under **Settings > Secrets**, add:
   - `GEMINI_API_KEY`
   - `HF_TOKEN`
4. Push this repository to your Space repository.
5. Hugging Face builds the Docker container and serves on port 7860.

---

## 📑 Academic Documentation

- [`MODEL_CARD.md`](./MODEL_CARD.md) — Intended use, models, data, metrics, limitations, ethical considerations.
- [`DESIGN_NOTES.md`](./DESIGN_NOTES.md) — Design choices, alternatives rejected, viva defense notes.
- [`FAILURES.md`](./FAILURES.md) — Empirical failure case study on low-light and cluttered images.
- [`REPORT_NOTES.md`](./REPORT_NOTES.md) — PDF report outline with real tables and figures.
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — 2-to-3 minute video demonstration script & pre-flight checklist.
- [`LICENSES.md`](./LICENSES.md) — Open-source license terms and data provenance.
