# Visual Question Answering (VQA) Studio

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10 | 3.11](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch 2.5](https://img.shields.io/badge/PyTorch-2.5%20(CPU)-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Salesforce BLIP](https://img.shields.io/badge/BLIP--VQA-Salesforce-blue)](https://huggingface.co/Salesforce/blip-vqa-base)
[![Google Gemini Flash](https://img.shields.io/badge/Gemini_Flash-Google_GenAI-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-24%2F24%20Passed-brightgreen)](https://github.com/ParasSalunke/visual-question-answering)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live_on_Vercel-black?logo=vercel&logoColor=white)](https://visual-question-answering-rho.vercel.app/)

<p align="center">
  <b>A comprehensive, production-grade multimodal Visual Question Answering platform.</b><br>
  Combines classical encoder-decoder vision-language modeling (<b>Salesforce BLIP-VQA</b>) with modern autoregressive generative LLMs (<b>Google Gemini Flash</b>), embedding-based semantic evaluation (<b>all-MiniLM-L6-v2</b>), synthetic adversarial hard-case generation (<b>SD-Turbo</b>), and Responsible AI guardrails.
</p>

[**🌐 Live Web Application**](https://visual-question-answering-rho.vercel.app/) • [**📚 Swagger API Docs**](https://visual-question-answering-rho.vercel.app/docs) • [**⚡ API Health Check**](https://visual-question-answering-rho.vercel.app/api/health)

</div>

---

## 📋 Table of Contents

- [Executive Overview](#-executive-overview)
- [System Architecture](#-system-architecture)
- [Core Features & Course Units](#-core-features--course-units)
  - [Unit 1: Guided Question Templates](#unit-1-guided-question-templates-u1)
  - [Unit 2: LLM Sentence Expansion & Prompt Comparison](#unit-2-llm-sentence-expansion--prompt-comparison-u2)
  - [Unit 3: Dual Vision Engine & Accessibility](#unit-3-dual-vision-engine--accessibility-u3)
  - [Unit 4: Test Image Lab & Adversarial Presets](#unit-4-test-image-lab--adversarial-presets-u4)
  - [Unit 5: Benchmark Evaluation & Failure Study](#unit-5-benchmark-evaluation--failure-study-u5)
  - [Layer V: Responsible AI & Guardrails](#layer-v-responsible-ai--guardrails-layer-v)
- [Empirical Benchmark Results](#-empirical-benchmark-results)
- [Project Directory Structure](#-project-directory-structure)
- [REST API Reference](#-rest-api-reference)
- [Local Installation & Quickstart](#-local-installation--quickstart)
- [Deployment Guide](#-deployment-guide)
  - [Vercel (Production Multi-Service)](#1-deploy-to-vercel-recommended)
  - [Render (Web Service)](#2-deploy-to-render)
  - [Docker / Hugging Face Spaces](#3-deploy-with-docker--hugging-face-spaces)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Academic Documentation & Course Artifacts](#-academic-documentation--course-artifacts)
- [License & Provenance](#-license--provenance)

---

## 🎯 Executive Overview

**VQA Studio** was engineered as an individual university Generative AI course project (50 Marks). The system addresses a fundamental limitation in classical Vision-Language Models (VLMs): while models such as Salesforce BLIP produce accurate short visual answers (e.g., *"red"*, *"3"*, *"yes"*), real-world conversational interfaces and assistive technologies require fluent, grammatically complete, and contextual English sentences.

To solve this, VQA Studio implements a **dual-stage multimodal pipeline**:
1. **Perception Stage**: An image model analyzes the visual scene and extracts a terse, factual answer with confidence estimation and candidate probability distributions.
2. **Expansion Stage**: An autoregressive LLM (Gemini Flash) restates the user's question and incorporates the perceived answer into a grammatical sentence without introducing new facts or hallucinated details.
3. **Rigorous Academic Benchmarking**: A 20-pair ground-truth benchmark suite evaluates accuracy, latency, and confidence calibration across Normal, Low-Light, and Cluttered domains, accompanied by an empirical failure taxonomy and an unanswerable question hallucination study.

---

## 🏛️ System Architecture

The following diagram illustrates the complete end-to-end data flow and decoupled service architecture:

```
+----------------------------------------------------------------------------------------------------+
|                                      FRONTEND CLIENT TIER                                          |
|  • React 19 SPA (Vite + TypeScript + Tailwind CSS v4)                                              |
|  • Hash Router navigation: /ask, /testlab, /evaluation, /learn, /responsible-ai                    |
|  • Dynamic Template Interpolation  • SpeechSynthesis ("Read Aloud")  • ARIA Live Announcements     |
+-------------------------------------------------+--------------------------------------------------+
                                                  | JSON / Multipart Form-Data
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    API GATEWAY & ROUTING TIER                                      |
|  • FastAPI (Python 3.10 / 3.11) on Uvicorn (Local) or Vercel Serverless Function (/api/index.py)  |
|  • In-Memory Processing (io.BytesIO)  • Content-Type / File-Size Guardrails (<5MB)                 |
|  • Dual-Prefix Middleware: transparently routes both /api/* and root paths                         |
+-------------------+-----------------------------+------------------------------+-------------------+
                    |                             |                              |
                    v                             v                              v
+----------------------------------+ +--------------------------+ +----------------------------------+
|      VISION INFERENCE TIER       | |   LLM EXPANSION TIER     | |   BENCHMARK EVALUATION TIER      |
|                                  | |                          | |                                  |
| [Engine 1: Salesforce BLIP-VQA]  | | [Google Gemini Flash]    | | [Ground Truth Benchmark]         |
| • Model: blip-vqa-base (385M)    | | • Zero-Shot Expansion    | | • 20 Core Pairs (Normal, Dark,   |
| • Local PyTorch CPU Inference    | | • Few-Shot (5+ Examples) | |   Cluttered)                     |
| • Beam Search + Seq Scores       | | • Fidelity Gating        | |                                  |
| • Softmax Normalized Top-K       | | • Syntactic Regex Fallback| | [Dual-Verdict Matching Engine]   |
|                                  | +--------------------------+ | • Regex Text Normalization       |
| [Engine 2: Gemini 3.5 Vision]    |                              | • all-MiniLM-L6-v2 Cosine Sim    |
| • Cloud Multimodal Vision        |                              |   (Threshold >= 0.80)            |
| • Low-Memory Cloud Delegation    |                              | • Confidence Calibration Gap     |
+----------------------------------+                              +----------------------------------+
                    |                                                            |
                    v                                                            v
+----------------------------------------------------------------------------------------------------+
|                                RESPONSIBLE AI & ETHICAL GUARDRAILS                                 |
|  • Ephemeral RAM-Only Image Processing: Zero disk retention, images strictly handled in-memory     |
|  • 10-Question Unanswerable Benchmark: Measured hallucination rate on non-visible visual queries   |
|  • PII & Facial Recognition Refusal: Blocks privacy-sensitive identification requests             |
|  • Low-Confidence Warning Banner: Automatic UI warning when confidence falls below 0.45           |
|  • In-Memory Sliding-Window Rate Limiting: 60 requests/minute per client IP                        |
+----------------------------------------------------------------------------------------------------+
```

---

## 🌟 Core Features & Course Units

### Unit 1: Guided Question Templates (U1)
- **26 Structured Templates** spanning 8 distinct semantic categories:
  - *Existence* (`"Is there a {object} in this image?"`)
  - *Counting* (`"How many {objects} are visible?"`)
  - *Colour* (`"What color is the {object}?"`)
  - *Spatial Relation* (`"What object is {relation} the {reference}?"`)
  - *Activity / State* (`"What action is being performed by {subject}?"`)
  - *Text / OCR* (`"What text is written on the {item}?"`)
  - *Scene & Lighting* (`"What is the overall lighting condition?"`)
  - *Accessibility & Navigation* (`"Is the path ahead clear of obstacles?"`)
- **Dynamic Variable Interpolation**: Users fill in parameter chips (`{object}`, `{relation}`, `{reference}`) with instant live preview updates in the prompt input field.
- **Defensive Error Handling**: Fully protected against malformed payloads via fallback array type-checking.

### Unit 2: LLM Sentence Expansion & Prompt Comparison (U2)
- Converts terse 1-to-3 word perceptual answers into polished, natural English sentences:
  - Input: *Question = "What kind of traffic sign is visible?"*, *Short Answer = "stop sign"*
  - Expanded: *"The visible traffic sign is a stop sign."*
- **Interactive Prompt Comparison**:
  - **Zero-Shot Prompting**: Direct task instruction with strict negative constraints (*"Do not add any outside knowledge"*).
  - **Few-Shot Prompting**: Enhanced with 5+ curated in-context exemplar pairs covering existence, colors, counts, actions, and negations.
  - Displays latency, token efficiency, and sentence output side-by-side.
- **Fidelity-Gating Guardrail**: Prevents hallucination by validating that the expanded output strictly restates facts present in the question and short answer.
- **Deterministic Syntactic Fallback**: If cloud connectivity is lost or API quotas expire, an embedded regex template engine builds grammatical sentences locally with zero downtime.

### Unit 3: Dual Vision Engine & Accessibility (U3)
- **Salesforce BLIP-VQA Base** (`Salesforce/blip-vqa-base`):
  - 385 million parameter vision-language model running locally on PyTorch CPU in `torch.inference_mode()`.
  - Computes top-$k$ normalized candidate answers using beam sequence scores and teacher-forced cross-entropy.
- **Google Gemini 3.5 Flash Vision**:
  - Cloud multimodal engine executing fast visual perception with high-fidelity grounding.
  - Automatically acts as the serverless delegation engine in low-memory or CPU-constrained cloud environments (such as Vercel Serverless or Render Free Tier).
- **Side-by-Side Engine Comparison**: One-click execution of both engines simultaneously, displaying delta in latency, confidence scores, and answer semantics.
- **Web Speech API "Read Aloud"**: Built-in speech synthesis provides audio playback of the expanded sentence for assistive accessibility.
- **Accessibility Compliance**: `aria-live="polite"` dynamic screen-reader announcements, high-contrast dark/light theme toggle, and keyboard-navigable controls.

### Unit 4: Test Image Lab & Adversarial Presets (U4)
- **6 Hard-Case Adversarial Presets**:
  1. *Low-Light / Underexposed*: Extreme underexposure and shadow occlusion.
  2. *Cluttered Desktop*: High visual entropy with overlapping cables, mugs, and stationery.
  3. *Partially Occluded Object*: Severe target occlusion requiring pattern completion.
  4. *Tiny Objects*: Sub-pixel objects testing spatial resolution limits.
  5. *Glare & Specular Reflection*: Intense highlights obscuring surface details.
  6. *Many-Item Counting*: High-density array of similar items testing enumerative accuracy.
- **Synthetic Image Generation**: Generates high-entropy adversarial images via Stability AI SD-Turbo (`stabilityai/sd-turbo`) or deterministic procedural geometric fallbacks.
- **Automated Preprocessing**: In-memory Lanczos downscaling to 512px max dimension preserving aspect ratio.
- **"Save to Eval Set" Modal**: One-click promotion of generated or uploaded test images into the active evaluation benchmark suite.

### Unit 5: Benchmark Evaluation & Failure Study (U5)
- **20 Core Ground-Truth Pairs**:
  - 8 Normal Baseline pairs (high contrast, single subject).
  - 6 Low-Light Stress pairs (underexposed rooms, dark hallways).
  - 6 Cluttered Adversarial pairs (dense desktops, overlapping objects).
- **Dual-Verdict Matching Pipeline**:
  - *Tier 1: Rule-Based Normalization*: Lowercases text, strips punctuation, removes English articles (*a*, *an*, *the*), and converts number words (*"three"* $\rightarrow$ *"3"*).
  - *Tier 2: Semantic Cosine Similarity*: Encodes predictions and references using `all-MiniLM-L6-v2` embeddings, grading as correct if cosine similarity $\ge 0.80$ (with pure-Python dot-product fallback when `numpy` is unavailable).
- **Human-in-the-Loop Override & Notes**: Teachers and evaluators can manually flip verdicts and annotate failure rationales directly in the browser.
- **Confidence Calibration Metric**:
  $$\text{Calibration Gap} = \bar{C}_{\text{correct}} - \bar{C}_{\text{incorrect}}$$
  A positive gap confirms the model exhibits lower confidence when it is incorrect, proving it is not dangerously overconfident.
- **Failure Taxonomy Tagging**: Categorizes failures into `too dark`, `clutter`, `misclassification`, `counting error`, and `occlusion` for viva defense.
- **Instant Export**: Export benchmark results to standalone CSV or Markdown reports in one click.

### Layer V: Responsible AI & Guardrails (Layer V)
- **Hallucination Evaluation on 10 Unanswerable Visual Questions**:
  - Evaluates questions that cannot be answered from the visual evidence (e.g., *"What is written on the back of the card?"*, *"What brand of battery is inside the toy?"*).
  - Measures the model's refusal rate vs hallucination rate (penalizing confident fabricated guesses).
- **Zero Disk Retention Privacy Policy**: Uploaded images are strictly decoded in RAM (`io.BytesIO`) and discarded immediately upon response completion. No user images are ever stored on disk.
- **Refusal Filters for PII & Facial Recognition**: Rejects attempts to identify individuals, extract biometric information, or read sensitive personal credentials.
- **Confidence Warning Indicator**: Automatically highlights a warning alert when prediction confidence falls below $0.45$.
- **Sliding-Window Rate Limiting**: In-memory rate limiting enforced at 60 requests per minute per IP address.

---

## 📊 Empirical Benchmark Results

All figures reported below represent actual measured runs on the 20-pair ground truth benchmark.

### 1. PyTorch CPU Local Benchmark (Salesforce BLIP-VQA Base)

```
========================================================================
BLIP-VQA Base (Salesforce/blip-vqa-base) on Intel/AMD x86_64 CPU
========================================================================
Overall Accuracy:           60.0% (12 / 20 correct)
Mean Latency:               612.2 ms per query
Mean Correct Confidence:    43.95%
Mean Incorrect Confidence:  35.57%
Confidence Calibration Gap: +8.38% (Positive separation confirms calibration)

Category Performance:
• Normal Baseline:          87.5% (7 / 8 correct)  |  Mean Latency: 604.4 ms
• Low-Light Stress:         66.7% (4 / 6 correct)  |  Mean Latency: 565.5 ms
• Cluttered Adversarial:    16.7% (1 / 6 correct)  |  Mean Latency: 657.8 ms
========================================================================
```

### 2. Cloud Serverless Benchmark (Google Gemini 3.5 Flash Vision)

```
========================================================================
Gemini 3.5 Flash Vision via Serverless Cloud Delegation
========================================================================
Overall Accuracy:           55.0% (11 / 20 correct)
Mean Latency:               2373.3 ms per query
Mean Correct Confidence:    95.00%
Mean Incorrect Confidence:  55.56%
Confidence Calibration Gap: +39.44% (Strong confidence separation)

Category Performance:
• Normal Baseline:          75.0% (6 / 8 correct)  |  Mean Latency: 2908.1 ms
• Low-Light Stress:         50.0% (3 / 6 correct)  |  Mean Latency: 2170.7 ms
• Cluttered Adversarial:    33.3% (2 / 6 correct)  |  Mean Latency: 1862.8 ms
========================================================================
```

### 3. Key Empirical Findings for Viva Defense
1. **The Spatial Clutter Bottleneck**: Cluttered scenes with overlapping objects represent the primary failure mode across both local and cloud models ($16.7\%$ to $33.3\%$ accuracy). In dense visual fields, spatial cross-attention distributes over background distractors, leading to object misidentification.
2. **Confidence Calibration**: Both models demonstrate positive confidence gaps ($+8.38\%$ on BLIP, $+39.44\%$ on Gemini), showing that when models fail, their output probability drops significantly, allowing downstream applications to trigger fallback warnings safely.

---

## 📂 Project Directory Structure

```
visual-question-answering/
├── api/                               # Standalone serverless deployment bundle
│   ├── backend/                       # Mirrors backend logic for Vercel Serverless
│   ├── eval/                          # Evaluation pairs & results metadata
│   ├── index.py                       # Vercel Serverless entrypoint (FastAPI app)
│   └── requirements.txt               # Lightweight serverless Python dependencies
├── backend/                           # Core FastAPI application package
│   ├── main.py                        # FastAPI routes, CORS, rate limiting, middlewares
│   ├── templates.json                 # 26 structured question templates across 8 categories
│   ├── services/
│   │   ├── blip_service.py            # Salesforce BLIP-VQA CPU inference & beam search
│   │   ├── gemini_service.py          # Gemini Flash vision & zero/few-shot expansion
│   │   ├── image_gen_service.py       # SD-Turbo & procedural adversarial generators
│   │   ├── eval_service.py            # Dual-verdict matching, MiniLM embeddings, calibration
│   │   └── guardrails.py              # PII detection, image size limits, ephemeral validation
│   └── tests/                         # Pytest test suite (24 unit & integration tests)
│       ├── test_api_endpoints.py      # HTTP route integration tests
│       ├── test_expand.py             # LLM sentence expansion tests
│       ├── test_guardrails.py         # File validation & PII refusal tests
│       ├── test_normalization.py      # Dual-verdict text normalization tests
│       └── test_templates.py          # Template placeholder parsing tests
├── eval/                              # Academic benchmark evaluation suite
│   ├── images/                        # 20 curated test images (normal, lowlight, cluttered)
│   ├── pairs.json                     # Ground truth labels, categories, and references
│   ├── results.json                   # Real benchmark execution results and overrides
│   └── unanswerable.json              # 10 unanswerable questions for hallucination testing
├── frontend/                          # React 19 + TypeScript + Vite frontend
│   ├── dist/                          # Production-ready compiled assets
│   ├── public/                        # Static assets, icons, and test image mirrors
│   ├── src/
│   │   ├── App.tsx                    # Shell layout, navigation bar, footer, health pill
│   │   ├── api.ts                     # Typed API client with defensive error fallbacks
│   │   ├── index.css                  # Tailwind CSS v4 styling & dark theme variables
│   │   ├── main.tsx                   # React root entrypoint
│   │   └── pages/
│   │       ├── AskPage.tsx            # U1-U3: Interactive VQA studio with 3-step wizard
│   │       ├── TestLabPage.tsx        # U4: Adversarial presets & SD-Turbo generation
│   │       ├── EvaluationPage.tsx     # U5: Benchmark runner, failure study, CSV export
│   │       ├── LearnPage.tsx          # Educational walkthrough of course syllabus
│   │       └── ResponsibleAIPage.tsx  # Layer V: Hallucination benchmark & PII checks
├── scripts/                           # Utility scripts for CLI runs and verification
│   ├── run_eval.py                    # Command-line benchmark execution script
│   └── smoke_test.py                  # End-to-end HTTP smoke test suite
├── .env.example                       # Environment variable template
├── .python-version                    # Python runtime lock (3.11.9 for Render/Linux)
├── DEMO_SCRIPT.md                     # 2-to-3 minute video demonstration script
├── DESIGN_NOTES.md                    # Architectural rationale & alternatives rejected
├── Dockerfile                         # Multi-stage production container build
├── FAILURES.md                        # Empirical failure case study with student notes
├── LICENSES.md                        # Third-party licenses & data provenance
├── MODEL_CARD.md                      # Hugging Face standard model card
├── render.yaml                        # Infrastructure-as-code blueprint for Render
├── REPORT_NOTES.md                    # Academic report outline with figures and tables
├── requirements.txt                   # Full local dependencies (including PyTorch CPU)
├── requirements-cpu.txt               # PyTorch CPU wheel index specification
├── requirements-render.txt            # Render deployment dependencies
├── RESULTS.md                         # Detailed record of measured benchmark runs
└── vercel.json                        # Vercel multi-service configuration & rewrites
```

---

## 🔌 REST API Reference

The backend exposes a RESTful API with automated OpenAPI documentation accessible at `/docs` (Swagger UI) and `/redoc` (ReDoc).

| Method | Endpoint | Description | Request Payload | Response Sample |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System health, loaded models & active engines | None | `{"status":"healthy","blip_loaded":true}` |
| `GET` | `/api/templates` | 26 question templates across 8 categories | None | `[{"id":"exist_1","category":"existence",...}]` |
| `GET` | `/api/presets` | 6 adversarial hard-case presets | None | `{"low_light":{"title":"Low-Light",...}}` |
| `POST` | `/api/vqa` | Multimodal VQA inference | `multipart/form-data`: `image`, `question`, `engine` | `{"short_answer":"red","confidence":0.95,...}` |
| `POST` | `/api/expand` | LLM sentence expansion | `{"question":"...","short_answer":"...","technique":"both"}` | `{"zero_shot":{"sentence":"..."},"few_shot":{...}}` |
| `POST` | `/api/generate`| Generate hard-case image | `{"prompt":"...","provider":"hf"}` | `{"image_base64":"data:image/jpeg;base64,..."}` |
| `GET` | `/api/eval/pairs` | Fetch 20 ground-truth benchmark pairs | None | `[{"id":"pair_01","ground_truth":"red",...}]` |
| `POST` | `/api/eval/run` | Execute 20-pair benchmark | `{"engine":"blip","threshold":0.80}` | `{"accuracy":60.0,"latency_ms":612.2,...}` |
| `GET` | `/api/eval/results` | Retrieve latest benchmark results | None | `{"summary":{"overall_accuracy":60.0},...}` |
| `PUT` | `/api/eval/results` | Human override of verdict / student notes | `{"id":"pair_04","verdict":false,"notes":"..."}` | `{"status":"updated"}` |
| `GET` | `/api/eval/export/csv` | Download evaluation benchmark as CSV | None | CSV file stream |
| `GET` | `/api/eval/export/markdown` | Download evaluation benchmark as Markdown | None | Markdown file stream |
| `POST` | `/api/eval/unanswerable/run` | Run 10-pair hallucination evaluation | Query param `?engine=blip` | `{"hallucination_rate":0.30,...}` |

---

## 💻 Local Installation & Quickstart

### Prerequisites
- **Python**: Version `3.10` or `3.11`
- **Node.js**: Version `20.x` or higher and `npm`
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/ParasSalunke/visual-question-answering.git
cd visual-question-answering
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

Open `.env` in your editor and configure your keys:
```env
# Optional: Enables cloud vision, few-shot sentence expansion, and hallucination tests
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# Optional: Enables SD-Turbo synthetic test image generation
HF_TOKEN=your_huggingface_token_here
IMAGE_PROVIDER=hf

# Server configuration
PORT=7860
LOW_MEMORY_MODE=false
```
*(Note: If API keys are omitted, the application runs gracefully using local PyTorch CPU inference and deterministic regex sentence builders).*

### 3. Set Up Python Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies (includes PyTorch CPU wheels)
pip install -r requirements.txt
```

### 4. Build Frontend Assets
```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Launch the Application Server
```bash
# Run FastAPI server with hot-reload enabled
python -m uvicorn backend.main:app --host 127.0.0.1 --port 7860 --reload
```

Open your browser and navigate to:
- **Application UI**: [http://127.0.0.1:7860](http://127.0.0.1:7860)
- **Interactive Swagger Docs**: [http://127.0.0.1:7860/docs](http://127.0.0.1:7860/docs)

---

## 🚢 Deployment Guide

### 1. Deploy to Vercel (Recommended)
This repository is configured out-of-the-box for **Vercel Multi-Service Deployment** via [`vercel.json`](./vercel.json).

1. Push your code to a GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
3. Import your repository. Vercel automatically detects the dual services:
   - **Frontend**: Vite Single Page Application (`frontend/`)
   - **Backend API**: Python Serverless Function (`api/index.py`)
4. In the Vercel project settings, navigate to **Settings > Environment Variables** and add:
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `GEMINI_MODEL` = `gemini-3.5-flash-lite`
   - `LOW_MEMORY_MODE` = `true`
5. Click **Deploy**. Vercel compiles the Vite frontend and deploys the FastAPI serverless backend under a single unified domain!

### 2. Deploy to Render
The repository includes an infrastructure blueprint ([`render.yaml`](./render.yaml)) and lean dependencies ([`requirements-render.txt`](./requirements-render.txt)):

1. Link your GitHub repository in the [Render Dashboard](https://dashboard.render.com/).
2. Select **Web Service** with the following settings:
   - **Environment**: `Python`
   - **Python Version**: Locked to `3.11.9` via [`.python-version`](./.python-version)
   - **Build Command**: `pip install -r requirements-render.txt && cd frontend && npm install && npm run build && cd ..`
   - **Start Command**: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables: `GEMINI_API_KEY`, `LOW_MEMORY_MODE=true`.

### 3. Deploy with Docker / Hugging Face Spaces
Build and run the self-contained multi-stage container locally or deploy to Hugging Face Spaces (Docker SDK):

```bash
# Build Docker image
docker build -t vqa-studio .

# Run Docker container
docker run -p 7860:7860 -e GEMINI_API_KEY="your_api_key" vqa-studio
```
The Docker image uses Node 20 to compile the React frontend, then copies the artifacts into a slim Python 3.11 image containing PyTorch CPU, serving the unified full-stack application on port 7860.

---

## 🧪 Testing & Quality Assurance

### Run Unit and Integration Tests
The repository includes a comprehensive 24-test suite implemented with `pytest` covering API endpoints, sentence expansion, normalization, and Responsible AI guardrails:

```bash
pytest backend/tests/ -v
```

```
=================================== test session starts ===================================
backend/tests/test_api_endpoints.py ....                                            [ 16%]
backend/tests/test_expand.py ....                                                   [ 33%]
backend/tests/test_guardrails.py .......                                            [ 62%]
backend/tests/test_normalization.py ......                                          [ 87%]
backend/tests/test_templates.py ...                                                 [100%]
=================================== 24 passed in 14.99s ===================================
```

### Run End-to-End Smoke Test
Run the automated pre-flight verification script against a running server:
```bash
python scripts/smoke_test.py
```

### Run CLI Evaluation Benchmark
Run the 20-pair evaluation benchmark directly from your terminal:
```bash
# Run benchmark on local BLIP engine
python scripts/run_eval.py blip

# Run benchmark on Gemini cloud vision engine
python scripts/run_eval.py gemini
```

---

## 📑 Academic Documentation & Course Artifacts

To fulfill all requirements of the university Generative AI individual project (50 Marks), the repository includes exhaustive academic documentation:

| Document | Purpose & Syllabus Coverage |
| :--- | :--- |
| [**`MODEL_CARD.md`**](./MODEL_CARD.md) | Standardized Hugging Face model card detailing intended use, model architecture, training data provenance, evaluation metrics, ethical limitations, and environmental factors. |
| [**`DESIGN_NOTES.md`**](./DESIGN_NOTES.md) | Architectural rationale, trade-off analysis, alternatives rejected (CLIP ranking, pure end-to-end VLMs, local LLMs on CPU), and answers to potential viva defense questions. |
| [**`FAILURES.md`**](./FAILURES.md) | Deep empirical failure analysis on low-light and cluttered images with taxonomy classification and student analytical notes. |
| [**`REPORT_NOTES.md`**](./REPORT_NOTES.md) | Comprehensive 5-page PDF report template with real data tables, LaTeX mathematical equations, and prompt comparison studies. |
| [**`DEMO_SCRIPT.md`**](./DEMO_SCRIPT.md) | Complete 2-to-3 minute video demonstration script with exact verbal voiceover, on-screen actions, and pre-flight recording checklist. |
| [**`LICENSES.md`**](./LICENSES.md) | Detailed open-source licensing terms for all third-party models, libraries, and datasets used. |
| [**`RESULTS.md`**](./RESULTS.md) | Complete record of ground-truth predictions, scores, and human overrides across evaluation runs. |

---

## 📜 License & Provenance

- **Source Code**: Released under the [MIT License](https://opensource.org/licenses/MIT).
- **Models**:
  - `Salesforce/blip-vqa-base` is governed by the [BSD-3-Clause License](https://github.com/salesforce/BLIP/blob/main/LICENSE.txt).
  - `sentence-transformers/all-MiniLM-L6-v2` is governed by the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
  - `stabilityai/sd-turbo` is governed by the [Stability AI CreativeML OpenRAIL-M License](https://huggingface.co/stabilityai/sd-turbo/blob/main/LICENSE.md).
- **Coursework Statement**: Developed as an original individual academic submission for the university Generative AI Course (2026). All benchmark numbers and failure analyses reflect real empirical testing.
