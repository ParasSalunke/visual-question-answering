"""
Visual Question Answering App - Captioned UI Screenshot Generator
Creates captioned UI diagrammatic mockups and visual overviews for the 5 app pages.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).resolve().parent.parent
SCREENSHOTS_DIR = ROOT_DIR / "docs" / "screenshots"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

def draw_header(draw, title, subtitle, bg_color=(37, 99, 235)):
    draw.rectangle([0, 0, 1280, 100], fill=bg_color)
    draw.text((40, 25), title, fill=(255, 255, 255))
    draw.text((40, 60), subtitle, fill=(219, 234, 254))

def create_ask_page_screenshot():
    img = Image.new("RGB", (1280, 800), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)
    draw_header(draw, "VQA Studio — Ask Page (Home) [Tasks U1 + U2 + U3]", "Dual-Engine Multimodal Visual Question Answering with LLM Expansion")
    
    # Left Box: Image upload & sample gallery
    draw.rectangle([40, 130, 620, 520], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 150), "Input Image: normal_01_red_car.jpg (512x512 RGB)", fill=(30, 41, 59))
    # Draw simulated car
    draw.rectangle([160, 230, 500, 360], fill=(220, 38, 38))
    draw.ellipse([210, 340, 280, 410], fill=(30, 41, 59))
    draw.ellipse([380, 340, 450, 410], fill=(30, 41, 59))
    draw.text((60, 440), "Quick Samples: [Red Car] [3 Cups] [Apple] [Stop Sign]", fill=(100, 116, 139))
    
    # Right Box: Template & Question
    draw.rectangle([660, 130, 1240, 520], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((680, 150), "Question Template: 'What color is the {object}?' (Category: colour)", fill=(30, 41, 59))
    draw.rectangle([680, 190, 1220, 260], fill=(241, 245, 249), outline=(203, 213, 225))
    draw.text((700, 215), "Question: What color is the car?", fill=(15, 23, 42))
    
    draw.text((680, 285), "Selected Engine: Salesforce BLIP-VQA (Local PyTorch CPU)", fill=(37, 99, 235))
    
    # Output area
    draw.rectangle([680, 320, 1220, 490], fill=(239, 246, 255), outline=(191, 219, 254), width=2)
    draw.text((700, 340), "Step 2 (Short Answer): 'red'  |  Confidence: 62.2%  |  Latency: 555 ms", fill=(30, 58, 138))
    draw.text((700, 380), "Step 3 (Expanded Sentence): 'The car is red.'", fill=(15, 23, 42))
    draw.text((700, 420), "Prompt Comparison: Zero-Shot (350ms, 100% fidelity) vs Few-Shot (480ms, 100% fidelity)", fill=(100, 116, 139))
    draw.text((700, 455), "Audio: Web Speech API 'Read Aloud' Active", fill=(16, 185, 129))
    
    # Caption footer
    draw.rectangle([0, 740, 1280, 800], fill=(15, 23, 42))
    draw.text((40, 760), "Figure 1: Ask Page UI showing core end-to-end flow from image upload and template selection to terse perception and LLM expansion.", fill=(241, 245, 249))
    
    img.save(SCREENSHOTS_DIR / "01_ask_page.png")

def create_test_lab_screenshot():
    img = Image.new("RGB", (1280, 800), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)
    draw_header(draw, "VQA Studio — Test Image Lab [Task U4]", "Adversarial Hard-Case Generation & Visual Verification", bg_color=(126, 34, 206))
    
    # 6 Preset cards
    presets = [
        "1. Low-Light / Underexposed",
        "2. Cluttered Desktop",
        "3. Partially Occluded Object",
        "4. Tiny / Small Objects",
        "5. Glare & Specular Reflection",
        "6. Many-Item Counting"
    ]
    for i, p in enumerate(presets):
        col = i % 3
        row = i // 3
        x = 40 + col * 400
        y = 130 + row * 220
        draw.rectangle([x, y, x + 380, y + 190], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
        draw.text((x + 20, y + 20), p, fill=(30, 41, 59))
        draw.rectangle([x + 20, y + 55, x + 360, y + 125], fill=(248, 250, 252), outline=(226, 232, 240))
        draw.text((x + 30, y + 70), "Prompt: Adversarial synthetic prompt...", fill=(100, 116, 139))
        draw.rectangle([x + 20, y + 140, x + 160, y + 175], fill=(126, 34, 206))
        draw.text((x + 40, y + 152), "Generate", fill=(255, 255, 255))
        
    # Warning Banner
    draw.rectangle([40, 590, 1240, 680], fill=(254, 243, 199), outline=(252, 211, 77), width=2)
    draw.text((60, 610), "Academic Warning (Hard Rule): Image generators often hallucinate counts and details.", fill=(146, 64, 14))
    draw.text((60, 640), "Students must visually verify generated images before saving to the evaluation set with ground truth.", fill=(180, 83, 9))
    
    # Caption footer
    draw.rectangle([0, 740, 1280, 800], fill=(15, 23, 42))
    draw.text((40, 760), "Figure 2: Test Image Lab UI with 6 adversarial presets and manual ground-truth verification safeguards.", fill=(241, 245, 249))
    
    img.save(SCREENSHOTS_DIR / "02_test_lab.png")

def create_eval_screenshot():
    img = Image.new("RGB", (1280, 800), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)
    draw_header(draw, "VQA Studio — Evaluation Benchmark [Task U5]", "Empirical 20-Pair Benchmark, Category Breakdown & Failure Gallery", bg_color=(5, 150, 105))
    
    # KPI Cards
    kpis = [
        ("Overall Accuracy", "60.0% (12/20)", (5, 150, 105)),
        ("Mean Latency", "612.2 ms", (30, 41, 59)),
        ("Correct Confidence", "43.95%", (16, 185, 129)),
        ("Calibration Gap", "+8.38%", (217, 119, 6))
    ]
    for i, (label, val, col) in enumerate(kpis):
        x = 40 + i * 305
        draw.rectangle([x, 130, x + 285, 220], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
        draw.text((x + 20, y_val := 145), label, fill=(100, 116, 139))
        draw.text((x + 20, 175), val, fill=col)
        
    # Category table
    draw.rectangle([40, 240, 1240, 430], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 260), "Visual Category Performance Breakdown (Real Benchmark Run)", fill=(30, 41, 59))
    draw.text((60, 300), "• Normal Scenes:     7 / 8 passed (87.5% Accuracy)  |  Latency: 604.4 ms", fill=(16, 185, 129))
    draw.text((60, 335), "• Low-Light Scenes:  4 / 6 passed (66.7% Accuracy)  |  Latency: 565.5 ms", fill=(217, 119, 6))
    draw.text((60, 370), "• Cluttered Scenes:  1 / 6 passed (16.7% Accuracy)  |  Latency: 657.8 ms (Severe Attention Dispersal)", fill=(220, 38, 38))
    
    # Failure gallery preview
    draw.rectangle([40, 450, 1240, 710], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 470), "Failure Gallery Case Study: pair_15 (cluttered desktop mug)", fill=(220, 38, 38))
    draw.text((60, 505), "Q: 'What color is the round mug on the desk?' | GT: 'red' | Model Prediction: 'yellow' (Conf: 30.0%)", fill=(30, 41, 59))
    draw.text((60, 540), "Root Cause: High-density stationery distractors diffused cross-attention weights away from focal mug.", fill=(100, 116, 139))
    draw.text((60, 575), "Controls: [Override Verdict] [Failure Reason Dropdown: 'clutter'] [Save Notes to FAILURES.md]", fill=(37, 99, 235))
    draw.text((60, 615), "Export: [Export results.csv] [Export RESULTS.md]", fill=(5, 150, 105))
    
    # Caption footer
    draw.rectangle([0, 740, 1280, 800], fill=(15, 23, 42))
    draw.text((40, 760), "Figure 3: Evaluation Dashboard displaying real quantitative metrics (60% accuracy, +8.4% calibration) and failure case study.", fill=(241, 245, 249))
    
    img.save(SCREENSHOTS_DIR / "03_evaluation_dashboard.png")

def create_learn_screenshot():
    img = Image.new("RGB", (1280, 800), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)
    draw_header(draw, "VQA Studio — Syllabus Map (Learn Page) [Layers I to IV]", "Theoretical Foundations, Attention Softmax Proof & Cross-Attention Mechanics", bg_color=(29, 78, 216))
    
    # Layer 1
    draw.rectangle([40, 130, 620, 410], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 150), "Layer I: VQA Lifecycle & Probability Calibration", fill=(30, 41, 59))
    draw.text((60, 185), "Lifecycle: Data -> Model -> Prompt -> Inference -> Expansion -> Eval -> Feedback", fill=(100, 116, 139))
    draw.text((60, 220), "BLIP Top-K Answer Probabilities (Softmax Beam Scores):", fill=(30, 41, 59))
    draw.text((60, 255), "1. 'red': 45.8% | 2. 'black': 15.9% | 3. 'red/black': 13.9% | 4. 'red/white': 12.4%", fill=(37, 99, 235))
    draw.text((60, 300), "Zero-Shot vs Few-Shot Prompt Comparison Table (Measured)", fill=(5, 150, 105))
    
    # Layer 2 Attention Math
    draw.rectangle([660, 130, 1240, 410], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((680, 150), "Layer II: Attention Mechanics & Softmax Proof", fill=(30, 41, 59))
    draw.text((680, 185), "Formula: Attention(Q, K, V) = Softmax( Q K^T / √d_k ) V", fill=(126, 34, 206))
    draw.text((680, 225), "Worked Numeric Proof (d=2):", fill=(30, 41, 59))
    draw.text((680, 255), "• Q = [1, 0], K1 = [1, 0], K2 = [0, 1]", fill=(100, 116, 139))
    draw.text((680, 285), "• Scaled Dot Products: s1 = 0.707, s2 = 0.000", fill=(100, 116, 139))
    draw.text((680, 315), "• Softmax Weights: [0.67, 0.33]", fill=(100, 116, 139))
    draw.text((680, 345), "• Output Vector: 0.67*V1 + 0.33*V2 = [0.67, 0.33]", fill=(37, 99, 235))
    
    # Layer 3 & 4
    draw.rectangle([40, 430, 1240, 710], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 450), "Layer III & IV: Models & Tools Matrix (Free CPU Constraints)", fill=(30, 41, 59))
    draw.text((60, 490), "• Salesforce BLIP-VQA (ViT + BERT Cross-Attention): 446M params running in PyTorch CPU inference mode", fill=(30, 41, 59))
    draw.text((60, 525), "• Google Gemini 2.5 Flash: Autoregressive transformer for U2 expansion and comparative vision", fill=(30, 41, 59))
    draw.text((60, 560), "• all-MiniLM-L6-v2: Sentence-Transformers BERT model for 384-dimensional dense semantic matching", fill=(30, 41, 59))
    draw.text((60, 595), "• Why Fine-Tuning was Omitted: HF Spaces free tier (2 vCPU, 16GB RAM) makes gradient backpropagation unviable.", fill=(220, 38, 38))
    
    # Caption footer
    draw.rectangle([0, 740, 1280, 800], fill=(15, 23, 42))
    draw.text((40, 760), "Figure 4: Learn Page UI documenting syllabus theoretical foundations, worked attention math, and model architecture mapping.", fill=(241, 245, 249))
    
    img.save(SCREENSHOTS_DIR / "04_learn_syllabus_map.png")

def create_responsible_ai_screenshot():
    img = Image.new("RGB", (1280, 800), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)
    draw_header(draw, "VQA Studio — Responsible AI & Guardrails [Layer V]", "Hallucination Benchmark, Privacy Standards & Accessibility Ethics", bg_color=(225, 29, 72))
    
    # Hallucination test
    draw.rectangle([40, 130, 1240, 360], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 150), "Measured Hallucination Benchmark on 10 Unanswerable Visual Questions", fill=(30, 41, 59))
    draw.text((60, 190), "• Measured Hallucination Rate: 30.0% (3/10 false assertions on absent objects)", fill=(220, 38, 38))
    draw.text((60, 225), "• Proper Refusal Rate: 70.0% (Correctly indicated 'not visible' or 'none')", fill=(16, 185, 129))
    draw.text((60, 260), "• Test Probes: 'What kind of dog is inside the car?' -> Model Output: 'not visible' (Passed Refusal)", fill=(100, 116, 139))
    
    # Guardrails
    draw.rectangle([40, 380, 1240, 560], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 400), "Active Production Guardrails & Privacy Architecture", fill=(30, 41, 59))
    draw.text((60, 435), "1. Ephemeral In-Memory Processing: Images decoded into RAM byte buffers; zero disk storage.", fill=(37, 99, 235))
    draw.text((60, 470), "2. Facial Recognition / PII Refusal: Intercepts queries seeking to identify individual people or faces.", fill=(220, 38, 38))
    draw.text((60, 505), "3. Low-Confidence Warning: Triggers warning whenever model confidence drops below 0.45.", fill=(217, 119, 6))
    
    # Accessibility
    draw.rectangle([40, 580, 1240, 710], fill=(255, 255, 255), outline=(226, 232, 240), width=2)
    draw.text((60, 600), "Accessibility Note: High-Stakes Vision Applications for Low-Vision Users", fill=(30, 41, 59))
    draw.text((60, 630), "Low-vision users frequently capture low-light photos. Because vision models drop to 66% accuracy in dim scenes,", fill=(100, 116, 139))
    draw.text((60, 655), "communicating confidence numerically and providing audio read-aloud prevents dangerous physical navigation false positives.", fill=(100, 116, 139))
    
    # Caption footer
    draw.rectangle([0, 740, 1280, 800], fill=(15, 23, 42))
    draw.text((40, 760), "Figure 5: Responsible AI Page showing measured hallucination rate (30%), active guardrails, and accessibility ethics.", fill=(241, 245, 249))
    
    img.save(SCREENSHOTS_DIR / "05_responsible_ai.png")

if __name__ == "__main__":
    create_ask_page_screenshot()
    create_test_lab_screenshot()
    create_eval_screenshot()
    create_learn_screenshot()
    create_responsible_ai_screenshot()
    print("Generated 5 captioned UI screenshots in docs/screenshots/")
