import pytest
from backend.services.eval_service import normalize_answer, eval_service

def test_normalize_basic_casing_and_punctuation():
    assert normalize_answer("Red.") == "red"
    assert normalize_answer("  A bright red car! ") == "bright red car"
    assert normalize_answer("Yes, definitely.") == "yes definitely"

def test_normalize_articles():
    assert normalize_answer("a dog") == "dog"
    assert normalize_answer("an apple") == "apple"
    assert normalize_answer("the chair") == "chair"

def test_normalize_number_words():
    assert normalize_answer("two") == "2"
    assert normalize_answer("three cups") == "3 cups"
    assert normalize_answer("there are four chairs") == "there are 4 chairs"

def test_evaluate_prediction_exact():
    is_corr, score, m_type = eval_service.evaluate_prediction(
        prediction="red", ground_truth="red", alternates=["dark red"]
    )
    assert is_corr is True
    assert score == 1.0
    assert m_type == "exact_match"

def test_evaluate_prediction_alternates():
    is_corr, score, m_type = eval_service.evaluate_prediction(
        prediction="3", ground_truth="three", alternates=["3", "three cups"]
    )
    assert is_corr is True
    assert score == 1.0
    assert m_type == "exact_match"

def test_evaluate_prediction_mismatch():
    is_corr, score, m_type = eval_service.evaluate_prediction(
        prediction="blue", ground_truth="red", alternates=[]
    )
    assert is_corr is False
    assert m_type == "mismatch"
