"""
User preferences repository for database operations.

This module contains repository classes for all user preferences database operations.
"""

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.repository import BaseRepository
from src.user_preferences.models import UserCategoryPreference, UserPreferences
from src.user_preferences.schemas import (
    UserCategoryPreferenceCreate,
    UserCategoryPreferenceUpdate,
    UserPreferencesCreate,
    UserPreferencesUpdate,
)


class UserPreferencesRepository(
    BaseRepository[UserPreferences, UserPreferencesCreate, UserPreferencesUpdate]
):
    """Repository for general user preferences database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(UserPreferences, db)

    async def get_by_user_id(self, user_id: int) -> UserPreferences | None:
        """Get user preferences by user ID."""
        query = select(self.model).where(self.model.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_user_preferences(
        self, user_id: int, preferences_data: UserPreferencesCreate
    ) -> UserPreferences:
        """Create user preferences."""
        # Convert ui_preferences dict to JSON string for storage
        ui_preferences_json = None
        if preferences_data.ui_preferences:
            ui_preferences_json = json.dumps(preferences_data.ui_preferences)

        db_obj = self.model(
            user_id=user_id,
            default_currency=preferences_data.default_currency,
            language=preferences_data.language,
            ui_preferences=ui_preferences_json,
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update_user_preferences(
        self, user_id: int, update_data: UserPreferencesUpdate
    ) -> UserPreferences | None:
        """Update user preferences by user ID."""
        preferences = await self.get_by_user_id(user_id)
        if not preferences:
            return None

        # Update fields that are provided
        update_dict = update_data.model_dump(exclude_unset=True)

        # Handle ui_preferences JSON serialization
        if "ui_preferences" in update_dict:
            ui_prefs = update_dict["ui_preferences"]
            update_dict["ui_preferences"] = json.dumps(ui_prefs) if ui_prefs else None

        for field, value in update_dict.items():
            setattr(preferences, field, value)

        await self.db.commit()
        await self.db.refresh(preferences)
        return preferences

    def _parse_ui_preferences(
        self, preferences: UserPreferences
    ) -> dict[str, Any] | None:
        """Parse UI preferences JSON string back to dict."""
        if not preferences.ui_preferences:
            return None

        try:
            return json.loads(preferences.ui_preferences)
        except json.JSONDecodeError:
            return None

    async def get_or_create_user_preferences(self, user_id: int) -> UserPreferences:
        """Get user preferences or create with defaults if they don't exist."""
        preferences = await self.get_by_user_id(user_id)

        if not preferences:
            # Create default preferences
            default_preferences = UserPreferencesCreate()
            preferences = await self.create_user_preferences(
                user_id, default_preferences
            )

        return preferences


class UserCategoryPreferenceRepository(
    BaseRepository[
        UserCategoryPreference,
        UserCategoryPreferenceCreate,
        UserCategoryPreferenceUpdate,
    ]
):
    """Repository for user category preferences database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(UserCategoryPreference, db)

    async def get_by_user_id(self, user_id: int) -> list[UserCategoryPreference]:
        """Get all category preferences for a specific user."""
        query = select(self.model).where(self.model.user_id == user_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_user_and_merchant(
        self, user_id: int, merchant_name: str
    ) -> UserCategoryPreference | None:
        """Get category preference for a specific user and merchant."""
        query = select(self.model).where(
            self.model.user_id == user_id, self.model.merchant_name == merchant_name
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def upsert_preference(
        self,
        user_id: int,
        merchant_name: str,
        category_name: str,
        confidence_score: float = 1.0,
    ) -> UserCategoryPreference:
        """Insert or update a user's category preference for a merchant."""
        # Capitalize the category name to ensure consistency
        category_name = category_name.title()

        # First try to find existing preference
        existing = await self.get_by_user_and_merchant(user_id, merchant_name)

        if existing:
            # Update existing preference
            existing.category_name = category_name
            existing.confidence_score = confidence_score
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            # Create new preference
            new_preference = UserCategoryPreference(
                user_id=user_id,
                merchant_name=merchant_name,
                category_name=category_name,
                confidence_score=confidence_score,
            )
            self.db.add(new_preference)
            await self.db.commit()
            await self.db.refresh(new_preference)
            return new_preference

    async def delete_by_user_and_merchant(
        self, user_id: int, merchant_name: str
    ) -> bool:
        """Delete a specific user's preference for a merchant."""
        preference = await self.get_by_user_and_merchant(user_id, merchant_name)
        if preference:
            await self.db.delete(preference)
            await self.db.commit()
            return True
        return False

    async def get_preferences_as_dict(self, user_id: int) -> dict[str, str]:
        """Get user's preferences as a merchant:category dictionary for AI processing."""
        preferences = await self.get_by_user_id(user_id)
        return {pref.merchant_name: pref.category_name for pref in preferences}

    async def create_category_preference(
        self, user_id: int, preference_data: UserCategoryPreferenceCreate
    ) -> UserCategoryPreference:
        """Create a new category preference."""
        return await self.upsert_preference(
            user_id=user_id,
            merchant_name=preference_data.merchant_name,
            category_name=preference_data.category_name,
            confidence_score=preference_data.confidence_score,
        )

    async def update_category_preference(
        self,
        preference_id: int,
        user_id: int,
        update_data: UserCategoryPreferenceUpdate,
    ) -> UserCategoryPreference | None:
        """Update a category preference by ID (ensuring user ownership)."""
        preference = await self.get_by_id(preference_id)

        if not preference or preference.user_id != user_id:
            return None

        # Update fields that are provided
        update_dict = update_data.model_dump(exclude_unset=True)

        # Capitalize category name if provided
        if "category_name" in update_dict:
            update_dict["category_name"] = update_dict["category_name"].title()

        for field, value in update_dict.items():
            setattr(preference, field, value)

        await self.db.commit()
        await self.db.refresh(preference)
        return preference
