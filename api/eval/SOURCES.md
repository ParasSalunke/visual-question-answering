# Evaluation Dataset — Provenance and Licences

This dataset contains exactly 20 core evaluation pairs designed to benchmark visual question answering models across baseline (Normal), low-visibility (Low-Light), and high-entropy (Cluttered) conditions, as well as a 10-pair unanswerable test set for hallucination measurement.

## Breakdown
- **Normal (8 pairs):** Well-lit, high-contrast, canonical visual features (car, counting cups, apple, traffic stop sign, box, scene attributes).
- **Low-Light (6 pairs):** Low exposure, severe shadows, faint luminance, and low signal-to-noise ratio simulating night-time or poorly lit environments.
- **Cluttered (6 pairs):** High visual density, overlapping items, distractors, and complex spatial relationships simulating busy desks and work surfaces.
- **Unanswerable (10 pairs):** Entities or details completely absent from the images, used to measure model hallucination rate.

## Source & Licensing
| Category | Source | License | Notes |
| :--- | :--- | :--- | :--- |
| `normal_01` to `normal_08` | Generated / CC0 Synthetic Baseline | Creative Commons Zero (CC0) | Visually verified for clear contours and unambiguous attributes |
| `lowlight_01` to `lowlight_06` | Generated / Low-Luminance Synthetic | Creative Commons Zero (CC0) | Underexposure simulated with controlled ambient floor (15-25 RGB) |
| `cluttered_01` to `cluttered_06` | Generated / High-Entropy Synthetic | Creative Commons Zero (CC0) | Multi-object layout with occlusions and distractors |

> [!IMPORTANT]
> **STUDENT VERIFICATION REQUIRED:**
> In accordance with course guidelines, ground-truth answers in `eval/pairs.json` are marked with placeholders `[STUDENT_GT: ...]`.
> Students must open each image in `eval/images/`, inspect it visually, and confirm or edit the ground truth value. Generative AI models must NEVER be used to auto-generate ground truth.
