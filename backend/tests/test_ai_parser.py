"""Tests for AI parser prompt building and response parsing."""

import pytest

from src.receipts.ai_parser import (
    UserCategoryContext,
    build_dynamic_prompt,
)


def test_build_dynamic_prompt_with_user_context():
    """Custom categories and preferences appear in prompt."""
    user_context = UserCategoryContext(
        custom_categories=[
            {"key": "car wash", "name": "Car Wash"},
            {"key": "fuel", "name": "Fuel"},
        ],
        learned_mappings=[
            {
                "item_name": "starbucks",
                "target_category": "dining",
                "confidence": 3.5,
            },
            {
                "item_name": "uber",
                "store_name": "uber technologies",
                "target_category": "transportation",
                "confidence": 4.0,
            },
        ],
    )

    prompt = build_dynamic_prompt(user_context)

    # Custom categories should be present with "PREFER THESE"
    assert "USER'S CUSTOM CATEGORIES (PREFER THESE)" in prompt
    assert "car wash" in prompt
    assert "fuel" in prompt

    # Learned preferences should be present
    assert "USER'S LEARNED PREFERENCES" in prompt
    assert "starbucks" in prompt
    assert "dining" in prompt
    assert "confidence: 3.5" in prompt

    # Store-specific preference
    assert "uber" in prompt
    assert "uber technologies" in prompt


def test_build_dynamic_prompt_without_context():
    """Prompt works without user context (backward compatible)."""
    prompt = build_dynamic_prompt(None)

    # Should have default categories
    assert "groceries:" in prompt.lower()
    assert "dining:" in prompt.lower()

    # Should NOT have user sections
    assert "USER'S CUSTOM CATEGORIES" not in prompt
    assert "USER'S LEARNED PREFERENCES" not in prompt
