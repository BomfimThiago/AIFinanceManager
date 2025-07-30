"""
User preferences dependencies for dependency injection.

This module provides FastAPI dependencies for user preferences operations.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.dependencies import get_db
from src.user_preferences.repository import (
    UserCategoryPreferenceRepository,
    UserPreferencesRepository,
)
from src.user_preferences.service import (
    UserCategoryPreferenceService,
    UserPreferencesService,
)

# ===== Repository Dependencies =====


async def get_user_preferences_repository(
    db: AsyncSession = Depends(get_db),
) -> UserPreferencesRepository:
    """Get user preferences repository instance."""
    return UserPreferencesRepository(db)


async def get_user_category_preference_repository(
    db: AsyncSession = Depends(get_db),
) -> UserCategoryPreferenceRepository:
    """Get user category preference repository instance."""
    return UserCategoryPreferenceRepository(db)


# ===== Service Dependencies =====


async def get_user_preferences_service(
    db: AsyncSession = Depends(get_db),
) -> UserPreferencesService:
    """Get user preferences service instance."""
    return UserPreferencesService(db)


async def get_user_category_preference_service(
    repository: UserCategoryPreferenceRepository = Depends(
        get_user_category_preference_repository
    ),
) -> UserCategoryPreferenceService:
    """Get user category preference service instance."""
    return UserCategoryPreferenceService(repository)
