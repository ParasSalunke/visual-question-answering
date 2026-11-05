# Visual Question Answering — Benchmark Evaluation Results

**Evaluated Engine:** GEMINI  
**Date:** 2026-11-05 12:51:33  
**Overall Accuracy:** 55.0% (11/20)  
**Mean Latency:** 2373.3 ms  
**Confidence Calibration:** Correct = 0.95 vs Incorrect = 0.5556 (Gap = 0.3944)

## Category Breakdown

| Category | Total Pairs | Correct | Accuracy (%) | Mean Latency (ms) |
| :--- | :---: | :---: | :---: | :---: |
| **Normal** | 8 | 6 | 75.0% | 2908.1 ms |
| **Low_light** | 6 | 3 | 50.0% | 2170.7 ms |
| **Cluttered** | 6 | 2 | 33.33% | 1862.8 ms |

## Detailed Predictions & Overrides

| ID | Category | Question | Ground Truth | Prediction | Conf | Verdict | Reason / Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| pair_01 | normal | What color is the car? | `red` | `red` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_02 | normal | How many cups are on the surface? | `3` | `three mugs` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_03 | normal | What fruit is shown in the image? | `apple` | `an apple` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_04 | normal | What kind of traffic sign is visible? | `stop sign` | `blank stop sign` | 0.95 | ❌ Fail | misclassification |
| pair_05 | normal | What object is resting on the surface? | `box` | `blue square` | 0.95 | ❌ Fail | misclassification |
| pair_06 | normal | Is the scene well-lit? | `yes` | `yes` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_07 | normal | Is this scene indoors or outdoors? | `indoors` | `indoors` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_08 | normal | Is the area clear of large obstructions? | `yes` | `yes` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_09 | low_light | What furniture is placed in the dark room? | `chair` | `not visible` | 0.40 | ❌ Fail | too dark |
| pair_10 | low_light | Is there a doorway or exit visible? | `yes` | `yes` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_11 | low_light | What is the lighting condition of the scene? | `dark` | `dark scene` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_12 | low_light | Is the path ahead safe to walk quickly? | `no` | `unknown` | 0.95 | ❌ Fail | too dark |
| pair_13 | low_light | What color is the chair? | `dark blue` | `not visible` | 0.40 | ❌ Fail | too dark |
| pair_14 | low_light | Are details clearly distinguishable? | `no` | `no` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_15 | cluttered | What color is the round mug on the desk? | `red` | `red or yellow` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_16 | cluttered | Is there a writing pen on the desk? | `yes` | `not visible` | 0.40 | ❌ Fail | clutter |
| pair_17 | cluttered | What object is to the left of the round mug? | `notebook` | `blue square` | 0.95 | ❌ Fail | clutter |
| pair_18 | cluttered | Is the desk clean and organized? | `no` | `no` | 0.95 | ✅ Pass | Verified by evaluation pipeline. |
| pair_19 | cluttered | Are there tangled cables visible on the surface? | `yes` | `error` | 0.00 | ❌ Fail | clutter |
| pair_20 | cluttered | What kind of setting is this? | `desk` | `error` | 0.00 | ❌ Fail | clutter |