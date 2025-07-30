"""
User preferences API endpoints.

This module contains the FastAPI router for user preferences management.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_user
from src.auth.preferences_schemas import (
    UserPreferences,
    UserPreferencesResponse,
    UserPreferencesUpdate,
)
from src.auth.preferences_service import UserPreferencesService
from src.auth.schemas import User
from src.shared.dependencies import get_db

router = APIRouter(prefix="/api/user/preferences", tags=["user-preferences"])


async def get_preferences_service(
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserPreferencesService:
    """Get user preferences service instance."""
    return UserPreferencesService(db)


@router.get("/", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_preferences_service)]
) -> UserPreferencesResponse:
    """Get current user's preferences with available options."""
    return await service.get_user_preferences_response(current_user.id)


@router.put("/", response_model=UserPreferences)
async def update_user_preferences(
    update_data: UserPreferencesUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_preferences_service)]
) -> UserPreferences:
    """Update current user's preferences."""
    try:
        preferences = await service.update_user_preferences(current_user.id, update_data)
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.put("/currency/{currency}", response_model=UserPreferences)
async def update_currency_preference(
    currency: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_preferences_service)]
) -> UserPreferences:
    """Update user's currency preference."""
    try:
        preferences = await service.update_currency_preference(current_user.id, currency.upper())
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.put("/language/{language}", response_model=UserPreferences)
async def update_language_preference(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_preferences_service)]
) -> UserPreferences:
    """Update user's language preference."""
    try:
        preferences = await service.update_language_preference(current_user.id, language.lower())
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.put("/ui", response_model=UserPreferences)
async def update_ui_preferences(
    ui_preferences: dict[str, Any],
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[UserPreferencesService, Depends(get_preferences_service)]
) -> UserPreferences:
    """Update user's UI preferences."""
    try:
        preferences = await service.update_ui_preferences(current_user.id, ui_preferences)
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User preferences not found"
            )
        return preferences
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e