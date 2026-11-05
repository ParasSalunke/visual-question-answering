# 2-to-3 Minute Demo Video Script & Presentation Guide

## 📋 Pre-Demo Checklist (Complete 10 Minutes Before Presentation)
- [ ] **Wake Up the Space:** Visit your Hugging Face Space URL in a browser. Ensure the status indicator says **Running** (not Sleeping or Building).
- [ ] **Test One Image:** Run a 1-click test with the "Red Car" demo sample to warm up CPU memory and cache.
- [ ] **Verify Audio:** Test your system speaker/headphones for the "Read Aloud" Web Speech demonstration.
- [ ] **Check Dark Mode:** Verify that toggling light/dark mode works smoothly.
- [ ] **Browser Zoom:** Set browser zoom to 100% or 110% for crisp screen recording.

---

## 🎬 Timed Video Script (Total: 2:45)

### 0:00 – 0:30 | Introduction & Architectural Framing
- **Action:** Open browser at `https://<your-space>.hf.space/#/ask`. Show the clean header, dark mode toggle, and CPU Health badge.
- **Spoken:**
  > *"Hello examiner. Today I am presenting my Visual Question Answering application for our Generative AI course. Our system addresses the core challenge of factual hallucination in vision-language models by decoupling perception from linguistic fluency: we pair Salesforce BLIP-VQA on local PyTorch CPU with Gemini Flash for sentence expansion, wrapped with strict Responsible AI guardrails."*

### 0:30 – 1:15 | Core Flow (U1 Template $\rightarrow$ U3 Vision $\rightarrow$ U2 Expansion)
- **Action:**
  1. Click the **"Red Car"** quick-demo card (or drag-and-drop a fresh photo).
  2. Click the **"Colour"** category chip; select the template *"What color is the {object}?"*.
  3. Click **"Ask Question"**.
  4. Point out the Stepper strip, the short answer `"red"` (62.2% confidence), and the expanded sentence *"The car is red."*
  5. Click **"Read Aloud"** to demonstrate the Web Speech API audio output.
  6. Toggle **"Compare Prompts"** to show Zero-Shot vs Few-Shot (5+ examples) side-by-side with latency and fidelity indicators.
- **Spoken:**
  > *"Notice our three-stage pipeline in the visual strip. Step 1 selects a question template with inline placeholders. In Step 2, BLIP generates a factual short answer with sequence beam probabilities. In Step 3, our LLM expands this into one grammatical sentence under an anti-hallucination gate. Notice our side-by-side comparison between Zero-Shot and Few-Shot prompt engineering, both maintaining 100% fidelity."*

### 1:15 – 1:50 | Test Image Lab (U4 Hard-Case Stress Testing)
- **Action:** Click navigation link **"Test Lab"**. Show the 6 presets. Click on **"Low-Light / Underexposed"**, show the editable prompt, and click **"Generate"**.
- **Spoken:**
  > *"In the Test Image Lab, we generate adversarial edge-case inputs like low-light, cluttered desks, and occlusions using SD-Turbo to find where vision models break. As required by our academic guidelines, I can visually verify any generated frame and save it directly to our evaluation set with student-typed ground truth."*

### 1:50 – 2:30 | Evaluation Dashboard & Failure Study (U5)
- **Action:**
  1. Navigate to **"Evaluation"**.
  2. Highlight the summary cards: **60.0% accuracy (12/20)**, **612 ms mean latency**, and the **+8.38% calibration gap**.
  3. Show the category breakdown table: **87.5% in Normal scenes** vs **16.7% in Cluttered scenes**.
  4. Click the **"Failure Gallery"** tab. Show `pair_15` (cluttered desk mug) or `pair_13` (dark chair).
  5. Demonstrate overriding a verdict or editing student notes.
  6. Point out the **"Export CSV"** button.
- **Spoken:**
  > *"Our Evaluation dashboard benchmarks 20 curated core pairs. Our real CPU run achieved 60.0% overall accuracy. Crucially, we observe a dramatic domain shift: normal scenes achieve 87.5% accuracy, but cluttered scenes collapse to 16.7% due to cross-attention dispersion across distractors. Our model displays healthy calibration, showing an 8.4% higher confidence on correct predictions than on errors."*

### 2:30 – 2:45 | Syllabus Map, Responsible AI & Conclusion
- **Action:** Quickly open **"Learn"** (show the Attention Softmax math & lifecycle diagram) and **"Responsible AI"** (show the 30% hallucination test on unanswerable questions and privacy guardrails).
- **Spoken:**
  > *"Finally, our Learn page documents all syllabus layers including worked softmax attention math, while our Responsible AI dashboard benchmarks hallucination rate on unanswerable queries with zero persistent disk storage. Thank you."*
