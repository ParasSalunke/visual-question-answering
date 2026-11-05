"""
Visual Question Answering App - End-to-End Smoke Test
Tests /api/health and /api/vqa against the live server at http://127.0.0.1:7860
"""

import sys
import httpx
from pathlib import Path

BASE_URL = "http://127.0.0.1:7860"
SAMPLE_IMAGE = Path(__file__).resolve().parent.parent / "eval" / "images" / "normal_01_red_car.jpg"

def run_smoke_test():
    print(f"--- Running Smoke Test against {BASE_URL} ---")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Health check
        print("[1/3] Probing /api/health...")
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(f"      Status: {res.json()}")

        # 2. VQA with sample image
        print(f"[2/3] Probing /api/vqa with {SAMPLE_IMAGE.name}...")
        assert SAMPLE_IMAGE.exists(), f"Sample image {SAMPLE_IMAGE} does not exist"
        with open(SAMPLE_IMAGE, "rb") as f:
            files = {"image": (SAMPLE_IMAGE.name, f, "image/jpeg")}
            data = {"question": "What color is the car?", "engine": "blip"}
            res = client.post("/api/vqa", files=files, data=data)
        assert res.status_code == 200, f"VQA failed: {res.text}"
        vqa_data = res.json()
        print(f"      Answer: '{vqa_data.get('short_answer')}' | Conf: {vqa_data.get('confidence')} | Latency: {vqa_data.get('latency_ms')}ms")

        # 3. Answer expansion
        print("[3/3] Probing /api/expand...")
        res = client.post("/api/expand", json={"question": "What color is the car?", "short_answer": vqa_data.get("short_answer", "red"), "technique": "both"})
        assert res.status_code == 200, f"Expand failed: {res.text}"
        exp_data = res.json()
        print(f"      Expanded: '{exp_data.get('sentence')}'")

    print("\n[SUCCESS] ALL SMOKE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        run_smoke_test()
    except Exception as e:
        print(f"[FAIL] Smoke test failed: {e}")
        sys.exit(1)
