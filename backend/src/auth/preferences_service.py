"""
User preferences service for business logic.

This module contains the service class for user preferences business operations.
"""

import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.preferences_models import UserPreferencesModel
from src.auth.preferences_repository import UserPreferencesRepository
from src.auth.preferences_schemas import (
    CURRENCY_OPTIONS,
    LANGUAGE_OPTIONS,
    UserPreferences,
    UserPreferencesCreate,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)


class UserPreferencesService:
    """Service for user preferences management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = UserPreferencesRepository(db)

    async def get_user_preferences(self, user_id: int) -> UserPreferences:
        """Get user preferences, creating defaults if they don't exist."""
        preferences_model = await self.repository.get_or_create_user_preferences(user_id)
        
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
            updated_at=preferences_model.updated_at
        )

    async def update_user_preferences(
        self, user_id: int, update_data: UserPreferencesUpdate
    ) -> UserPreferences | None:
        """Update user preferences."""
        # Ensure preferences exist first
        await self.repository.get_or_create_user_preferences(user_id)
        
        # Update preferences
        updated_model = await self.repository.update_user_preferences(user_id, update_data)
        
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
            updated_at=updated_model.updated_at
        )

    async def get_user_preferences_response(self, user_id: int) -> UserPreferencesResponse:
        """Get user preferences with available options."""
        preferences = await self.get_user_preferences(user_id)
        
        return UserPreferencesResponse(
            preferences=preferences,
            available_currencies=CURRENCY_OPTIONS,
            available_languages=LANGUAGE_OPTIONS
        )

    async def update_currency_preference(self, user_id: int, currency: str) -> UserPreferences | None:
        """Update only the currency preference."""
        if currency not in CURRENCY_OPTIONS:
            raise ValueError(f"Invalid currency. Must be one of: {', '.join(CURRENCY_OPTIONS)}")
        
        update_data = UserPreferencesUpdate(default_currency=currency)
        return await self.update_user_preferences(user_id, update_data)

    async def update_language_preference(self, user_id: int, language: str) -> UserPreferences | None:
        """Update only the language preference."""
        valid_languages = [lang["code"] for lang in LANGUAGE_OPTIONS]
        if language not in valid_languages:
            raise ValueError(f"Invalid language. Must be one of: {', '.join(valid_languages)}")
        
        update_data = UserPreferencesUpdate(language=language)
        return await self.update_user_preferences(user_id, update_data)

    async def update_ui_preferences(self, user_id: int, ui_preferences: dict[str, Any]) -> UserPreferences | None:
        """Update only the UI preferences."""
        update_data = UserPreferencesUpdate(ui_preferences=ui_preferences)
        return await self.update_user_preferences(user_id, update_data)