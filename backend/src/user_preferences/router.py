"""
User preferences API endpoints.

This module contains the FastAPI router for all user preferences management.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.user_preferences.dependencies import (
    get_user_category_preference_service,
    get_user_preferences_service,
)
from src.user_preferences.schemas import (
    UserCategoryPreference,
    UserCategoryPreferenceCreate,
    UserCategoryPreferenceListResponse,
    UserCategoryPreferenceUpdate,
    UserPreferences,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from src.user_preferences.service import (
    UserCategoryPreferenceService,
    UserPreferencesService,
)

router = APIRouter(prefix="/api/user/preferences", tags=["user-preferences"])


# ===== General User Preferences Endpoints =====


@router.get("/", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_user_preferences_service)],
) -> UserPreferencesResponse:
    """Get current user's preferences with available options."""
    return await service.get_user_preferences_response(current_user.id)


@router.put("/", response_model=UserPreferences)
async def update_user_preferences(
    update_data: UserPreferencesUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_user_preferences_service)],
) -> UserPreferences:
    """Update current user's preferences."""
    try:
        preferences = await service.update_user_preferences(
            current_user.id, update_data
        )
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found",
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


@router.put("/currency/{currency}", response_model=UserPreferences)
async def update_currency_preference(
    currency: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_user_preferences_service)],
) -> UserPreferences:
    """Update user's currency preference."""
    try:
        preferences = await service.update_currency_preference(
            current_user.id, currency.upper()
        )
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found",
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


@router.put("/language/{language}", response_model=UserPreferences)
async def update_language_preference(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_user_preferences_service)],
) -> UserPreferences:
    """Update user's language preference."""
    try:
        preferences = await service.update_language_preference(
            current_user.id, language.lower()
        )
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found",
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


@router.put("/ui", response_model=UserPreferences)
async def update_ui_preferences(
    ui_preferences: dict[str, Any],
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_user_preferences_service)],
) -> UserPreferences:
    """Update user's UI preferences."""
    try:
        preferences = await service.update_ui_preferences(
            current_user.id, ui_preferences
        )
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found",
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e


# ===== Category Preferences Endpoints =====


@router.get("/categories", response_model=UserCategoryPreferenceListResponse)
async def get_user_category_preferences(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        UserCategoryPreferenceService, Depends(get_user_category_preference_service)
    ],
) -> UserCategoryPreferenceListResponse:
    """Get all category preferences for the current user."""
    return await service.list_user_category_preferences(current_user.id)


@router.post("/categories", response_model=UserCategoryPreference)
async def create_category_preference(
    preference_data: UserCategoryPreferenceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        UserCategoryPreferenceService, Depends(get_user_category_preference_service)
    ],
) -> UserCategoryPreference:
    """Create a new category preference for the current user."""
    return await service.create_category_preference(current_user.id, preference_data)


@router.put("/categories/{preference_id}", response_model=UserCategoryPreference)
async def update_category_preference(
    preference_id: int,
    update_data: UserCategoryPreferenceUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        UserCategoryPreferenceService, Depends(get_user_category_preference_service)
    ],
) -> UserCategoryPreference:
    """Update a category preference."""
    preference = await service.update_category_preference(
        preference_id, current_user.id, update_data
    )
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category preference not found or access denied",
        )
    return preference


@router.delete("/categories/{preference_id}")
async def delete_category_preference(
    preference_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        UserCategoryPreferenceService, Depends(get_user_category_preference_service)
    ],
) -> dict[str, str]:
    """Delete a category preference."""
    success = await service.delete_category_preference(preference_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category preference not found or access denied",
        )
    return {"message": "Category preference deleted successfully"}


@router.put("/categories/merchant/{merchant_name}")
async def add_or_update_merchant_preference(
    merchant_name: str,
    category_name: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        UserCategoryPreferenceService, Depends(get_user_category_preference_service)
    ],
) -> dict[str, str]:
    """Add or update a category preference for a specific merchant."""
    await service.add_or_update_preference(
        current_user.id, merchant_name, category_name
    )
    return {"message": f"Preference updated: {merchant_name} -> {category_name}"}


@router.delete("/categories/merchant/{merchant_name}")
async def delete_merchant_preference(
    merchant_name: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        UserCategoryPreferenceService, Depends(get_user_category_preference_service)
    ],
) -> dict[str, str]:
    """Delete a category preference for a specific merchant."""
    success = await service.delete_preference(current_user.id, merchant_name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category preference not found for merchant",
        )
    return {"message": f"Preference deleted for merchant: {merchant_name}"}
