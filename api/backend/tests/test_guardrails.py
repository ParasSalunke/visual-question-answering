import pytest
from fastapi import HTTPException
from backend.services.guardrails import validate_image_bytes, validate_question

def test_validate_image_size_ok():
    # 1 KB dummy bytes
    data = b"\x00" * 1024
    validate_image_bytes(data)  # Should not raise

def test_validate_image_size_exceeded():
    # 6 MB dummy bytes
    data = b"\x00" * (6 * 1024 * 1024)
    with pytest.raises(HTTPException) as excinfo:
        validate_image_bytes(data)
    assert excinfo.value.status_code == 413
    assert "exceeds 5 MB limit" in excinfo.value.detail

def test_validate_empty_image():
    with pytest.raises(HTTPException) as excinfo:
        validate_image_bytes(b"")
    assert excinfo.value.status_code == 400

def test_validate_question_normal():
    is_valid, err = validate_question("What color is the car?")
    assert is_valid is True
    assert err == ""

def test_validate_question_length_limit():
    long_q = "what color is this " * 20
    is_valid, err = validate_question(long_q)
    assert is_valid is False
    assert "maximum allowed length" in err

def test_validate_question_face_identification_refusal():
    is_valid, err = validate_question("Who is this person in the image?")
    assert is_valid is False
    assert "Guardrail Refusal" in err
    assert "identify private individuals" in err

def test_validate_question_nsfw_refusal():
    is_valid, err = validate_question("Show me nsfw content")
    assert is_valid is False
    assert "Guardrail Refusal" in err
