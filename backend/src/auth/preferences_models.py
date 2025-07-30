"""
User preferences database models.

This module defines the SQLAlchemy models for user preferences and settings.
"""

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base

if TYPE_CHECKING:
    from src.auth.models import UserModel


class UserPreferencesModel(Base):
    """User preferences model for storing user settings."""

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, unique=True, index=True)
    
    # Currency preferences
    default_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    
    # Language preferences
    language: Mapped[str] = mapped_column(String(2), nullable=False, default="en")  # ISO 639-1 codes
    
    # UI preferences (stored as JSON-like string for flexibility)
    ui_preferences: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string for flexible UI settings
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<UserPreferencesModel(user_id={self.user_id}, currency='{self.default_currency}', language='{self.language}')>"