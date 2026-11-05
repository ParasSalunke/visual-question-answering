import pytest
from backend.services.gemini_service import gemini_service, _EXPAND_CACHE

def test_fidelity_check_token_match():
    # Direct token inclusion
    passed, score = gemini_service._check_fidelity("What color is the car?", "red", "The car is red.")
    assert passed is True
    assert score == 1.0

def test_fidelity_check_number_word():
    # Digit 3 in short answer, "three" in sentence
    passed, score = gemini_service._check_fidelity("How many cups are there?", "3", "There are three cups on the table.")
    assert passed is True

def test_fidelity_check_distortion():
    # Model hallucinating completely different answer
    passed, score = gemini_service._check_fidelity("What color is the car?", "red", "The sky is blue today.")
    assert passed is False

def test_fallback_expansion_when_api_key_missing(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    _EXPAND_CACHE.clear()
    res = gemini_service.expand_answer("What color is the car?", "red", technique="few_shot")
    assert res["is_fallback"] is True
    assert "The car is red." in res["sentence"]
    assert res["fidelity_passed"] is True
