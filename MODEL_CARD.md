# Model Card — Visual Question Answering System

## Model Details
- **Primary Vision-Language Model:** `Salesforce/blip-vqa-base` (Bootstrapping Language-Image Pre-training for Unified Vision-Language Understanding and Generation).
  - Architecture: Vision Transformer (ViT-B/16) visual encoder + BERT-style multimodal cross-attention decoder.
  - Parameters: ~446M parameters.
  - Execution: PyTorch 2.5 CPU inference mode with beam search sequence confidence.
- **Language Expansion Generator:** `gemini-2.5-flash` (Google DeepMind).
  - Architecture: Multimodal Autoregressive Transformer Decoder.
  - Generation Config: Temperature = 0.1, strict single-sentence anti-hallucination system prompt.
- **Semantic Evaluator:** `sentence-transformers/all-MiniLM-L6-v2`.
  - Architecture: 6-layer BERT-family sentence transformer mapping texts to 384-dimensional dense vectors.
- **Adversarial Image Generator:** `stabilityai/sd-turbo` via Hugging Face Inference API.

---

## Intended Use
- **Primary Purpose:** Visual Question Answering for educational exploration, assistive scene interpretation, and empirical multimodal robustness evaluation.
- **Target Audience:** Students, accessibility researchers, and assistive AI practitioners.
- **Out-of-Scope / Prohibited Uses:**
  - Facial recognition or biometric identity tracking of private individuals.
  - Generation or processing of sexually explicit or non-consensual imagery.
  - High-stakes autonomous navigation (e.g. self-driving vehicles or unassisted physical mobility) without human oversight.

---

## Performance & Quantitative Metrics

Benchmark results evaluated on the 20-pair core benchmark set:

| Evaluation Metric | Measured Value | Standard / Target |
| :--- | :---: | :---: |
| **Overall Accuracy** | **60.0%** (12/20) | Baseline Free-Tier CPU |
| **Normal Scene Accuracy** | **87.5%** (7/8) | High Canonical Accuracy |
| **Low-Light Accuracy** | **66.7%** (4/6) | Moderate Degradation |
| **Cluttered Scene Accuracy** | **16.7%** (1/6) | Severe Visual Interference |
| **Mean CPU Latency** | **612.2 ms** | Sub-second responsiveness |
| **Mean Correct Confidence** | **43.95%** | Calibrated Softmax |
| **Mean Incorrect Confidence** | **35.57%** | Separation Gap (+8.38%) |
| **Measured Hallucination Rate** | **30.0%** (3/10) | Unanswerable probe test |

---

## Failure Modes & Limitations
1. **Low-Light Chroma Compression:** At low luminance (< 30 RGB), ViT patch embeddings lose chromatic differentiation, frequently confusing dark blue with black or hallucinating absent objects.
2. **Dense Clutter & Occlusion:** When more than 5 distinct objects overlap on a single desk surface, cross-attention weights diffuse across competing visual tokens, leading to incorrect spatial and counting answers.
3. **High-Density Counting:** BLIP-VQA fails on counting questions exceeding 4 items without explicit bounding box proposals.

---

## Ethical Considerations & Guardrails
- **In-Memory Privacy:** Uploaded image byte streams are decoded in volatile RAM and immediately discarded. No images or questions are persisted to database or disk.
- **Automated Refusal:** Rule-based filters actively intercept face-identification questions (*"Who is this person?"*) and explicit queries.
- **Low-Confidence Warning:** Visual alert triggers when confidence $< 0.45$ to mitigate assistive over-reliance.
