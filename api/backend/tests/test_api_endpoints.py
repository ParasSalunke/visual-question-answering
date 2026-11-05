import io
from PIL import Image
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "blip_loaded" in data

def test_api_templates():
    response = client.get("/api/templates")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 25

def test_api_expand_fallback():
    response = client.post(
        "/api/expand",
        json={"question": "What color is the car?", "short_answer": "red", "technique": "few_shot"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "sentence" in data
    assert "red" in data["sentence"].lower()

def test_api_vqa_smoke():
    # Create small test image
    img = Image.new("RGB", (64, 64), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client.post(
        "/api/vqa",
        files={"image": ("test.jpg", buf, "image/jpeg")},
        data={"question": "What color is this?", "engine": "blip"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "short_answer" in data
    assert "confidence" in data
    assert "latency_ms" in data
    assert data["engine"] == "blip"
