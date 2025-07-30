"""
User preferences repository for database operations.

This module contains the repository class for user preferences database operations.
"""

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.preferences_models import UserPreferencesModel
from src.auth.preferences_schemas import UserPreferencesCreate, UserPreferencesUpdate
from src.shared.repository import BaseRepository


class UserPreferencesRepository(BaseRepository[UserPreferencesModel, UserPreferencesCreate, UserPreferencesUpdate]):
    """Repository for user preferences database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(UserPreferencesModel, db)

    async def get_by_user_id(self, user_id: int) -> UserPreferencesModel | None:
        """Get user preferences by user ID."""
        query = select(self.model).where(self.model.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_user_preferences(
        self, user_id: int, preferences_data: UserPreferencesCreate
    ) -> UserPreferencesModel:
        """Create user preferences."""
        # Convert ui_preferences dict to JSON string for storage
        ui_preferences_json = None
        if preferences_data.ui_preferences:
            ui_preferences_json = json.dumps(preferences_data.ui_preferences)

        db_obj = self.model(
            user_id=user_id,
            default_currency=preferences_data.default_currency,
            language=preferences_data.language,
            ui_preferences=ui_preferences_json
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update_user_preferences(
        self, user_id: int, update_data: UserPreferencesUpdate
    ) -> UserPreferencesModel | None:
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

    def _parse_ui_preferences(self, preferences: UserPreferencesModel) -> dict[str, Any] | None:
        """Parse UI preferences JSON string back to dict."""
        if not preferences.ui_preferences:
            return None
        
        try:
            return json.loads(preferences.ui_preferences)
        except json.JSONDecodeError:
            return None

    async def get_or_create_user_preferences(
        self, user_id: int
    ) -> UserPreferencesModel:
        """Get user preferences or create with defaults if they don't exist."""
        preferences = await self.get_by_user_id(user_id)
        
        if not preferences:
            # Create default preferences
            default_preferences = UserPreferencesCreate()
            preferences = await self.create_user_preferences(user_id, default_preferences)
        
        return preferences