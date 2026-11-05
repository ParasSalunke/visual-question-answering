# Architectural Design Notes & Viva Defense Preparation

This document records key engineering design decisions, rejected alternatives, and theoretical justifications for viva examination.

---

## 1. Key Architectural Decisions

### A. Two-Stage Perception $\rightarrow$ Fluency Pipeline (Vision Model + Generative LLM)
- **Question:** *Why not ask a single multimodal LLM (like Gemini or GPT-4V) to directly output complete sentences?*
- **Defense:**
  1. **Hallucination Containment:** End-to-end multimodal LLMs frequently generate verbose, speculative sentences with ungrounded adjectives and imaginary background objects. By forcing the vision backbone (BLIP) to output strictly a 1-to-3 word terse answer, we isolate perceptual certainty.
  2. **Auditability & Explainability:** Decoupling perception from linguistic fluency lets us extract mathematically rigorous sequence beam probabilities ($\text{softmax}(S)$) and top-k candidate distributions directly from the vision model.
  3. **Offline Reliability:** If cloud quotas (e.g. Gemini 429) or network connections fail, the local BLIP model still delivers 100% functional answers, backed by deterministic syntactic expansion fallback.

### B. Hybrid Evaluation Metric (Rule-Based Normalization + MiniLM Cosine Similarity)
- **Question:** *Why not use strict string equality or BLEU score for VQA evaluation?*
- **Defense:**
  1. Strict string matching fails on natural linguistic variations: `"3"` vs `"three"`, `"the red car"` vs `"red"`, or `"couch"` vs `"sofa"`.
  2. Rule-based preprocessing normalizes number words to digits, strips articles (`a`, `an`, `the`), and strips punctuation.
  3. For semantic near-equivalents, dense embeddings from `all-MiniLM-L6-v2` calculate cosine similarity. A threshold of $\ge 0.80$ provides high precision without false-positive semantic drift.

### C. In-Memory Ephemeral Image Processing
- **Question:** *Why are uploaded images never saved to disk?*
- **Defense:**
  1. **Responsible AI Privacy Standard:** Users often test personal images (family, workspaces, room interiors). Ephemeral in-memory handling guarantees zero data retention or leak risk.
  2. **Stateless Scalability:** The container remains stateless and immune to disk exhaustion from image accumulation on ephemeral cloud hosts like Hugging Face Spaces.

---

## 2. Alternatives Rejected & Trade-off Analysis

| Alternative Considered | Why It Was Rejected | Chosen Approach |
| :--- | :--- | :--- |
| **Fine-tuning BLIP on VQA-v2 via LoRA** | Exceeds the 2 vCPU / 16 GB RAM ceiling of Hugging Face Spaces; CPU backpropagation causes OOM crashes and unviable latency ($>30$ minutes per epoch). | Frozen inference mode with beam sequence scoring and prompt engineering. |
| **Direct Client-Side Gemini API Calls** | Exposing API keys in browser network tabs or `VITE_` variables violates Hard Rule #3 and is an industry anti-pattern. | All third-party calls routed via FastAPI backend with server-side environment variables. |
| **Heavy Computer Vision Libraries (OpenCV, TorchVision transforms)** | Inflates Docker build size by over 1.2 GB and introduces compilation instability across Linux wheel targets. | Native Pillow (PIL) resizing with LANCZOS antialiasing and in-memory byte buffers. |

---

## 3. High-Yield Viva Questions & Answers

### Q1: How does BLIP compute the confidence score shown in the UI?
> **Answer:** "During beam search generation, Hugging Face's decoder returns sequence scores representing length-penalized log-likelihoods: $\log P(Y|X) / L^\alpha$. We apply a softmax function across the top return beams to convert these relative log-likelihoods into normalized probabilities that sum to 1.0. If beam scores are unavailable, we execute a teacher-forced forward pass computing cross-entropy loss per token."

### Q2: What causes the dramatic accuracy drop in cluttered scenes (16.7%) compared to normal scenes (87.5%)?
> **Answer:** "In BLIP's ViT architecture, visual cross-attention relies on pairwise query-key similarities between question tokens and $16 \times 16$ image patches. In cluttered scenes with numerous overlapping objects (mugs, pens, cables, notebooks), attention weights disperse across competing visual patches (attention entropy increases), diluting the focal signal and resulting in distractors dominating the answer tokens."

### Q3: How does the fidelity check prevent Gemini from hallucinating during sentence expansion?
> **Answer:** "The expand service enforces a two-tier fidelity gate. First, it performs a normalized token inclusion check to ensure the short answer (or its numeric/lexical equivalent) is present in the generated sentence. Second, it computes embedding cosine similarity between the input `[Question + Short Answer]` pair and the expanded sentence. If the gate fails or if an API exception occurs, the system automatically falls back to deterministic rule-based sentence construction and badges the UI with a Fallback tag."
