"""
Income to Goal Link model.

This module contains the model for linking income transactions to goals.
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class IncomeGoalLinkModel(Base):
    """Model for linking income transactions to goals."""

    __tablename__ = "income_goal_links"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Foreign keys
    expense_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("expenses.id"), nullable=False, index=True
    )
    goal_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("goals.id"), nullable=False, index=True
    )

    # Link details
    amount_allocated: Mapped[float] = mapped_column(Float, nullable=False)
    allocation_percentage: Mapped[float] = mapped_column(Float, nullable=True)  # Percentage of income allocated
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # AI-suggested fields
    ai_suggested: Mapped[bool] = mapped_column(default=False, nullable=False)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0.0 to 1.0
    ai_reasoning: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    def __repr__(self):
        return f"<IncomeGoalLinkModel(id={self.id}, expense_id={self.expense_id}, goal_id={self.goal_id}, amount={self.amount_allocated})>"

