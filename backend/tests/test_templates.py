import json
import re
from pathlib import Path
import pytest

TEMPLATES_PATH = Path(__file__).resolve().parent.parent / "templates.json"
EXPECTED_CATEGORIES = {
    "existence",
    "counting",
    "colour",
    "spatial",
    "activity",
    "text_ocr",
    "scene_lighting",
    "accessibility",
}

def load_templates():
    with open(TEMPLATES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def test_templates_count_and_structure():
    templates = load_templates()
    assert len(templates) >= 25, f"Expected at least 25 templates, found {len(templates)}"
    
    ids = set()
    for item in templates:
        assert "id" in item, "Template item missing 'id'"
        assert "category" in item, f"Template {item.get('id')} missing 'category'"
        assert "template" in item, f"Template {item.get('id')} missing 'template'"
        assert "defaults" in item, f"Template {item.get('id')} missing 'defaults'"
        assert isinstance(item["defaults"], dict), f"Template {item['id']} defaults must be a dict"
        assert item["id"] not in ids, f"Duplicate template id: {item['id']}"
        ids.add(item["id"])

def test_template_categories():
    templates = load_templates()
    categories_found = set(item["category"] for item in templates)
    
    assert categories_found == EXPECTED_CATEGORIES, (
        f"Categories mismatch: missing {EXPECTED_CATEGORIES - categories_found}, "
        f"extra {categories_found - EXPECTED_CATEGORIES}"
    )

def test_template_placeholders_and_formatting():
    templates = load_templates()
    placeholder_pattern = re.compile(r"\{([a-zA-Z0-9_]+)\}")
    
    for item in templates:
        t_str = item["template"]
        defaults = item["defaults"]
        placeholders = set(placeholder_pattern.findall(t_str))
        
        # Ensure each placeholder in template string has a default key
        for ph in placeholders:
            assert ph in defaults, f"Template {item['id']} has placeholder {{{ph}}} missing in defaults"
            assert isinstance(defaults[ph], str) and len(defaults[ph].strip()) > 0, (
                f"Template {item['id']} default for {{{ph}}} should be a non-empty string"
            )
        
        # Test formatting produces a valid question without raw braces
        formatted = t_str.format(**defaults)
        assert "{" not in formatted and "}" not in formatted, f"Formatted string has unresolved braces: {formatted}"
        assert formatted.endswith("?"), f"Question should end with a question mark: {formatted}"
