from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.shared.models import BaseModel

if TYPE_CHECKING:
    from src.auth.models import User
    from src.expenses.models import Expense


class Category(BaseModel):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Category data
    name: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(20))  # "expense" or "income"
    icon: Mapped[str] = mapped_column(String(50))  # icon name
    color: Mapped[str] = mapped_column(String(7))  # hex color like #22c55e

    # Default category management
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    # For default categories, this links to the original template
    default_category_key: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="categories")


class UserCategoryPreference(BaseModel):
    """Stores learned mappings between items/stores and categories for a user.

    When a user corrects the AI's category classification, we store the mapping
    so the AI can learn the user's preferences for future classifications.
    """

    __tablename__ = "user_category_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # What was classified - normalized patterns for matching
    item_name_pattern: Mapped[str] = mapped_column(String(255), index=True)
    store_name_pattern: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )

    # User's preferred classification
    target_category: Mapped[str] = mapped_column(String(50))

    # Learning metadata
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    correction_count: Mapped[int] = mapped_column(Integer, default=1)
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Original AI classification (for analytics)
    original_category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    source_expense_id: Mapped[int | None] = mapped_column(
        ForeignKey("expenses.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship()
    source_expense: Mapped["Expense | None"] = relationship()
