"""Tests for category preference learning."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.categories.models import UserCategoryPreference
from src.categories.preference_repository import CategoryPreferenceRepository
from src.categories.preference_service import CategoryPreferenceService


@pytest.mark.asyncio
async def test_learn_from_correction_creates_preference(
    db_session: AsyncSession,
    test_user: User,
):
    """First correction creates a new preference."""
    repository = CategoryPreferenceRepository(db_session)
    service = CategoryPreferenceService(repository)

    preference = await service.learn_from_correction(
        user_id=test_user.id,
        item_name="Starbucks Coffee",
        corrected_category="dining",
        store_name="Mall Store",
        original_category="groceries",
    )

    assert preference.user_id == test_user.id
    assert preference.item_name_pattern == "starbucks coffee"  # normalized
    assert preference.store_name_pattern == "mall store"  # normalized
    assert preference.target_category == "dining"
    assert preference.original_category == "groceries"
    assert preference.confidence_score == 1.0
    assert preference.correction_count == 1


@pytest.mark.asyncio
async def test_learn_from_correction_reinforces_same(
    db_session: AsyncSession,
    test_user: User,
    test_preference: UserCategoryPreference,
):
    """Same correction increases confidence score."""
    repository = CategoryPreferenceRepository(db_session)
    service = CategoryPreferenceService(repository)

    # Initial confidence from fixture is 2.0
    initial_confidence = test_preference.confidence_score
    initial_count = test_preference.correction_count

    # Make same correction again
    updated = await service.learn_from_correction(
        user_id=test_user.id,
        item_name="starbucks",  # matches existing pattern
        corrected_category="dining",  # same as existing target
    )

    assert updated.confidence_score == initial_confidence + 0.5
    assert updated.correction_count == initial_count + 1


@pytest.mark.asyncio
async def test_get_preferences_for_ai_prompt(
    db_session: AsyncSession,
    test_user: User,
):
    """Get preferences ordered by confidence."""
    repository = CategoryPreferenceRepository(db_session)
    service = CategoryPreferenceService(repository)

    # Create preferences and manually set different confidence scores
    pref1 = await repository.create(
        user_id=test_user.id,
        item_name_pattern="uber",
        target_category="transportation",
    )
    # Reinforce multiple times to increase confidence
    await repository.reinforce_preference(pref1)  # 1.5
    await repository.reinforce_preference(pref1)  # 2.0
    await repository.reinforce_preference(pref1)  # 2.5

    pref2 = await repository.create(
        user_id=test_user.id,
        item_name_pattern="coffee",
        target_category="dining",
    )
    # confidence stays at 1.0

    pref3 = await repository.create(
        user_id=test_user.id,
        item_name_pattern="netflix",
        target_category="subscriptions",
    )
    await repository.reinforce_preference(pref3)  # 1.5

    preferences = await service.get_preferences_for_ai_prompt(test_user.id, limit=10)

    # Should be ordered by confidence descending
    assert len(preferences) == 3
    assert preferences[0].item_name_pattern == "uber"  # highest confidence (2.5)
    assert preferences[1].item_name_pattern == "netflix"  # (1.5)
    assert preferences[2].item_name_pattern == "coffee"  # lowest (1.0)
