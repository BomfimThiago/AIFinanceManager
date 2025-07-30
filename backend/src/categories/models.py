"""
Category database models.

This module defines the SQLAlchemy models for expense categories.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class CategoryModel(Base):
    """Category model for expense categorization."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(
        String(7), nullable=True
    )  # Hex color code
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Icon name
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True, index=True
    )  # NULL for default categories
    translations: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # {"name": {"en": "Food", "es": "Alimentación"}, "description": {"en": "Food expenses", "es": "Gastos de alimentación"}}
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Note: No direct relationship with ExpenseModel since expenses use category name strings

    def __repr__(self) -> str:
        return f"<CategoryModel(id={self.id}, name='{self.name}', is_default={self.is_default})>"
