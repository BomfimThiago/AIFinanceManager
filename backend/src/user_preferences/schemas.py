"""
User preferences Pydantic schemas.

This module contains Pydantic models for all user preferences validation and serialization.
"""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

# Supported currencies
CurrencyType = Literal["USD", "EUR", "BRL"]

# Supported languages
LanguageType = Literal["en", "es", "pt"]


# ===== General User Preferences Schemas =====


class UserPreferencesBase(BaseModel):
    """Base user preferences schema."""

    default_currency: CurrencyType = Field(
        default="EUR", description="User's default currency"
    )
    language: LanguageType = Field(
        default="en", description="User's preferred language (ISO 639-1 code)"
    )
    ui_preferences: dict[str, Any] | None = Field(
        default=None, description="Flexible UI preferences (theme, layout, etc.)"
    )


class UserPreferencesCreate(UserPreferencesBase):
    """Schema for creating user preferences."""

    pass


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""

    default_currency: CurrencyType | None = Field(
        None, description="User's default currency"
    )
    language: LanguageType | None = Field(None, description="User's preferred language")
    ui_preferences: dict[str, Any] | None = Field(None, description="UI preferences")


class UserPreferences(UserPreferencesBase):
    """Complete user preferences schema."""

    id: int = Field(..., description="Preferences ID")
    user_id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class UserPreferencesResponse(BaseModel):
    """Response schema for user preferences endpoints."""

    preferences: UserPreferences = Field(..., description="User preferences")
    available_currencies: list[str] = Field(..., description="Available currencies")
    available_languages: list[dict[str, str]] = Field(
        ..., description="Available languages with labels"
    )


# ===== Category Preferences Schemas =====


class UserCategoryPreferenceBase(BaseModel):
    """Base schema for user category preferences."""

    merchant_name: str = Field(
        ..., min_length=1, max_length=200, description="Merchant or account name"
    )
    category_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Preferred category for this merchant",
    )
    confidence_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="AI confidence score for this preference",
    )


class UserCategoryPreferenceCreate(UserCategoryPreferenceBase):
    """Schema for creating user category preferences."""

    pass


class UserCategoryPreferenceUpdate(BaseModel):
    """Schema for updating user category preferences."""

    category_name: str | None = Field(
        None, min_length=1, max_length=100, description="Updated category name"
    )
    confidence_score: float | None = Field(
        None, ge=0.0, le=1.0, description="Updated confidence score"
    )


class UserCategoryPreference(UserCategoryPreferenceBase):
    """Complete user category preference schema."""

    id: int = Field(..., description="Preference ID")
    user_id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class UserCategoryPreferenceListResponse(BaseModel):
    """Response schema for listing user category preferences."""

    preferences: list[UserCategoryPreference] = Field(
        ..., description="List of user category preferences"
    )
    total_count: int = Field(..., description="Total number of preferences")


# ===== Constants =====

# Language options with labels
LANGUAGE_OPTIONS = [
    {"code": "en", "label": "English", "native_label": "English"},
    {"code": "es", "label": "Spanish", "native_label": "Español"},
    {"code": "pt", "label": "Portuguese", "native_label": "Português"},
]

# Currency options
CURRENCY_OPTIONS = ["USD", "EUR", "BRL"]
