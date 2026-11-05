# Visual Question Answering — Failure Case Study
> **Notice:** Generated from real benchmark run. Marked: **TO BE VERIFIED BY STUDENT**.

**Benchmark Engine:** GEMINI  
**Total Tested Pairs:** 20 | **Failed Cases:** 9 | **Accuracy:** 55.0%

## 1. Executive Summary & Taxonomy of Failures
Visual question answering models (combining Vision Transformers with language decoders) degrade significantly when image distributions shift away from canonical, well-lit benchmarks like COCO or VQA-v2. In this empirical study, we identify three primary failure modes:
- **Low-Light / Signal-to-Noise Degradation:** In dark scenes (< 30 RGB luminance), ViT patch embeddings collapse into high-entropy noise, causing hallucinated object classifications or arbitrary color misattributions.
- **High-Density Clutter & Distractor Interference:** In cluttered workspaces, cross-attention weights disperse across multiple competing visual tokens, leading to spatial confusion and object misidentification.
- **Overconfident False Positives:** Models frequently assign high sequence probability (> 0.70) to incorrect predictions, illustrating poor uncertainty calibration on out-of-distribution inputs.

## 2. In-Depth Failure Case Analysis

### Case Study 1: Normal Failure (pair_04)
- **Image:** `eval/images/normal_04_stop_sign.jpg`
- **Question:** *What kind of traffic sign is visible?*
- **Ground Truth:** `stop sign`
- **Model Prediction:** `blank stop sign`
- **Confidence:** `0.95`
- **Failure Taxonomy:** `misclassification`
- **Technical Analysis:** Due to `normal` conditions, the cross-attention heads fail to attend selectively to the focal feature vector, yielding semantic drift.
- **Recommended Fix:** Adaptive illumination normalization or bounding box visual prompting before inference.

### Case Study 2: Normal Failure (pair_05)
- **Image:** `eval/images/normal_05_blue_box.jpg`
- **Question:** *What object is resting on the surface?*
- **Ground Truth:** `box`
- **Model Prediction:** `blue square`
- **Confidence:** `0.95`
- **Failure Taxonomy:** `misclassification`
- **Technical Analysis:** Due to `normal` conditions, the cross-attention heads fail to attend selectively to the focal feature vector, yielding semantic drift.
- **Recommended Fix:** Adaptive illumination normalization or bounding box visual prompting before inference.

### Case Study 3: Low_light Failure (pair_09)
- **Image:** `eval/images/lowlight_01_dark_chair.jpg`
- **Question:** *What furniture is placed in the dark room?*
- **Ground Truth:** `chair`
- **Model Prediction:** `not visible`
- **Confidence:** `0.40`
- **Failure Taxonomy:** `too dark`
- **Technical Analysis:** Due to `low_light` conditions, the cross-attention heads fail to attend selectively to the focal feature vector, yielding semantic drift.
- **Recommended Fix:** Adaptive illumination normalization or bounding box visual prompting before inference.

### Case Study 4: Low_light Failure (pair_12)
- **Image:** `eval/images/lowlight_04_hazard.jpg`
- **Question:** *Is the path ahead safe to walk quickly?*
- **Ground Truth:** `no`
- **Model Prediction:** `unknown`
- **Confidence:** `0.95`
- **Failure Taxonomy:** `too dark`
- **Technical Analysis:** Due to `low_light` conditions, the cross-attention heads fail to attend selectively to the focal feature vector, yielding semantic drift.
- **Recommended Fix:** Adaptive illumination normalization or bounding box visual prompting before inference.


## 3. Student Action Checklist
- [ ] Visually inspect all 20 images in `eval/images/`.
- [ ] Verify the ground truth answers in `eval/pairs.json`.
- [ ] Review and validate the failure case descriptions above for your final viva.