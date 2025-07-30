"""
User preferences database models.

This module defines all SQLAlchemy models for user preferences including
general preferences and category preferences.
"""

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class UserPreferences(Base):
    """User general preferences model for storing user settings."""

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True
    )

    # Currency preferences
    default_currency: Mapped[str] = mapped_column(
        String(3), nullable=False, default="EUR"
    )

    # Language preferences
    language: Mapped[str] = mapped_column(
        String(2), nullable=False, default="en"
    )  # ISO 639-1 codes

    # UI preferences (stored as JSON-like string for flexibility)
    ui_preferences: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # JSON string for flexible UI settings

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<UserPreferences(user_id={self.user_id}, currency='{self.default_currency}', language='{self.language}')>"


class UserCategoryPreference(Base):
    """User category preferences for AI learning and merchant-category mappings."""

    __tablename__ = "user_category_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    merchant_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Ensure unique merchant per user
    __table_args__ = (
        UniqueConstraint("user_id", "merchant_name", name="uq_user_merchant_category"),
    )

    def __repr__(self) -> str:
        return f"<UserCategoryPreference(user_id={self.user_id}, merchant='{self.merchant_name}', category='{self.category_name}')>"
