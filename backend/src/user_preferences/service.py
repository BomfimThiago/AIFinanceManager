"""
User preferences service for business logic.

This module contains service classes for all user preferences business operations.
"""

import json
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.user_preferences.models import UserCategoryPreference
from src.user_preferences.repository import (
    UserCategoryPreferenceRepository,
    UserPreferencesRepository,
)
from src.user_preferences.schemas import (
    CURRENCY_OPTIONS,
    LANGUAGE_OPTIONS,
    UserCategoryPreferenceCreate,
    UserCategoryPreferenceListResponse,
    UserCategoryPreferenceUpdate,
    UserPreferences,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from src.user_preferences.schemas import (
    UserCategoryPreference as UserCategoryPreferenceSchema,
)

logger = logging.getLogger(__name__)


class UserPreferencesService:
    """Service for general user preferences management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = UserPreferencesRepository(db)

    async def get_user_preferences(self, user_id: int) -> UserPreferences:
        """Get user preferences, creating defaults if they don't exist."""
        preferences_model = await self.repository.get_or_create_user_preferences(
            user_id
        )

        # Parse UI preferences JSON
        ui_preferences = None
        if preferences_model.ui_preferences:
            try:
                ui_preferences = json.loads(preferences_model.ui_preferences)
            except json.JSONDecodeError:
                ui_preferences = None

        # Convert to Pydantic model
        return UserPreferences(
            id=preferences_model.id,
            user_id=preferences_model.user_id,
            default_currency=preferences_model.default_currency,
            language=preferences_model.language,
            ui_preferences=ui_preferences,
            created_at=preferences_model.created_at,
            updated_at=preferences_model.updated_at,
        )

    async def update_user_preferences(
        self, user_id: int, update_data: UserPreferencesUpdate
    ) -> UserPreferences | None:
        """Update user preferences."""
        # Ensure preferences exist first
        await self.repository.get_or_create_user_preferences(user_id)

        # Update preferences
        updated_model = await self.repository.update_user_preferences(
            user_id, update_data
        )

        if not updated_model:
            return None

        # Parse UI preferences JSON
        ui_preferences = None
        if updated_model.ui_preferences:
            try:
                ui_preferences = json.loads(updated_model.ui_preferences)
            except json.JSONDecodeError:
                ui_preferences = None

        # Convert to Pydantic model
        return UserPreferences(
            id=updated_model.id,
            user_id=updated_model.user_id,
            default_currency=updated_model.default_currency,
            language=updated_model.language,
            ui_preferences=ui_preferences,
            created_at=updated_model.created_at,
            updated_at=updated_model.updated_at,
        )

    async def get_user_preferences_response(
        self, user_id: int
    ) -> UserPreferencesResponse:
        """Get user preferences with available options."""
        preferences = await self.get_user_preferences(user_id)

        return UserPreferencesResponse(
            preferences=preferences,
            available_currencies=CURRENCY_OPTIONS,
            available_languages=LANGUAGE_OPTIONS,
        )

    async def update_currency_preference(
        self, user_id: int, currency: str
    ) -> UserPreferences | None:
        """Update only the currency preference."""
        if currency not in CURRENCY_OPTIONS:
            raise ValueError(
                f"Invalid currency. Must be one of: {', '.join(CURRENCY_OPTIONS)}"
            )

        update_data = UserPreferencesUpdate(default_currency=currency)
        return await self.update_user_preferences(user_id, update_data)

    async def update_language_preference(
        self, user_id: int, language: str
    ) -> UserPreferences | None:
        """Update only the language preference."""
        valid_languages = [lang["code"] for lang in LANGUAGE_OPTIONS]
        if language not in valid_languages:
            raise ValueError(
                f"Invalid language. Must be one of: {', '.join(valid_languages)}"
            )

        update_data = UserPreferencesUpdate(language=language)
        return await self.update_user_preferences(user_id, update_data)

    async def update_ui_preferences(
        self, user_id: int, ui_preferences: dict[str, Any]
    ) -> UserPreferences | None:
        """Update only the UI preferences."""
        update_data = UserPreferencesUpdate(ui_preferences=ui_preferences)
        return await self.update_user_preferences(user_id, update_data)


class UserCategoryPreferenceService:
    """Service for user category preferences business logic."""

    def __init__(self, repository: UserCategoryPreferenceRepository):
        self.repository = repository

    async def add_or_update_preference(
        self, user_id: int, merchant_name: str, category_name: str
    ) -> UserCategoryPreference:
        """Add or update a user's category preference for a merchant."""
        logger.info(
            f"Adding/updating preference for user {user_id}: {merchant_name} -> {category_name}"
        )

        # Clean up the merchant name (strip whitespace, normalize)
        normalized_merchant = merchant_name.strip().lower()

        return await self.repository.upsert_preference(
            user_id=user_id,
            merchant_name=normalized_merchant,
            category_name=category_name,
            confidence_score=1.0,
        )

    async def get_user_preferences(self, user_id: int) -> dict[str, str]:
        """Get all category preferences for a user as a merchant:category dictionary."""
        return await self.repository.get_preferences_as_dict(user_id)

    async def get_user_preferences_for_ai_prompt(self, user_id: int) -> str:
        """Get user preferences formatted for AI prompts."""
        preferences = await self.get_user_preferences(user_id)

        if not preferences:
            return ""

        # Format as description:category lines
        preference_lines = [
            f"{description}:{category}" for description, category in preferences.items()
        ]
        preferences_text = "\n".join(preference_lines)

        return f"\n\nIMPORTANT - User's learned category preferences (description:category mappings):\n{preferences_text}\n\nWhen you find an expense with a description that matches a key above, ALWAYS use the corresponding category value. These are the user's preferred categories for specific transaction descriptions."

    async def delete_preference(self, user_id: int, merchant_name: str) -> bool:
        """Delete a user's category preference for a merchant."""
        normalized_merchant = merchant_name.strip().lower()
        return await self.repository.delete_by_user_and_merchant(
            user_id, normalized_merchant
        )

    async def get_category_for_merchant(
        self, user_id: int, merchant_name: str
    ) -> str | None:
        """Get the preferred category for a specific merchant, if any."""
        normalized_merchant = merchant_name.strip().lower()
        preference = await self.repository.get_by_user_and_merchant(
            user_id, normalized_merchant
        )
        return preference.category_name if preference else None

    async def list_user_category_preferences(
        self, user_id: int
    ) -> UserCategoryPreferenceListResponse:
        """Get all category preferences for a user."""
        preferences = await self.repository.get_by_user_id(user_id)

        preference_schemas = [
            UserCategoryPreferenceSchema(
                id=pref.id,
                user_id=pref.user_id,
                merchant_name=pref.merchant_name,
                category_name=pref.category_name,
                confidence_score=pref.confidence_score,
                created_at=pref.created_at,
                updated_at=pref.updated_at,
            )
            for pref in preferences
        ]

        return UserCategoryPreferenceListResponse(
            preferences=preference_schemas, total_count=len(preference_schemas)
        )

    async def create_category_preference(
        self, user_id: int, preference_data: UserCategoryPreferenceCreate
    ) -> UserCategoryPreferenceSchema:
        """Create a new category preference."""
        preference = await self.repository.create_category_preference(
            user_id, preference_data
        )

        return UserCategoryPreferenceSchema(
            id=preference.id,
            user_id=preference.user_id,
            merchant_name=preference.merchant_name,
            category_name=preference.category_name,
            confidence_score=preference.confidence_score,
            created_at=preference.created_at,
            updated_at=preference.updated_at,
        )

    async def update_category_preference(
        self,
        preference_id: int,
        user_id: int,
        update_data: UserCategoryPreferenceUpdate,
    ) -> UserCategoryPreferenceSchema | None:
        """Update a category preference."""
        preference = await self.repository.update_category_preference(
            preference_id, user_id, update_data
        )

        if not preference:
            return None

        return UserCategoryPreferenceSchema(
            id=preference.id,
            user_id=preference.user_id,
            merchant_name=preference.merchant_name,
            category_name=preference.category_name,
            confidence_score=preference.confidence_score,
            created_at=preference.created_at,
            updated_at=preference.updated_at,
        )

    async def delete_category_preference(
        self, preference_id: int, user_id: int
    ) -> bool:
        """Delete a category preference by ID (ensuring user ownership)."""
        preference = await self.repository.get_by_id(preference_id)

        if not preference or preference.user_id != user_id:
            return False

        await self.repository.delete(preference_id)
        return True
