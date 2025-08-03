"""
Financial Goals database models.

This module contains the SQLAlchemy models for the unified goals system,
including spending budgets, savings goals, and debt payoff goals.
"""

from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class GoalModel(Base):
    """SQLAlchemy model for financial goals (unified budgets/savings/debt system)."""

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Basic goal information
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Goal type and classification
    goal_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # spending, saving, debt
    time_horizon: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # short, medium, long
    recurrence: Mapped[str] = mapped_column(String(20), nullable=False)  # one_time, weekly, monthly, etc.
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)

    # Financial amounts
    target_amount: Mapped[float] = mapped_column(Float, nullable=False)
    current_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    contribution_amount: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Category (for spending goals only)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Time-based fields
    target_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    start_date: Mapped[datetime] = mapped_column(Date, nullable=False, server_default=func.current_date())

    # Configuration
    auto_calculate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)  # Auto-calc from expenses
    priority: Mapped[int] = mapped_column(nullable=False, default=1)  # 1=high, 2=medium, 3=low
    
    # Visual identification
    color: Mapped[str | None] = mapped_column(String(10), nullable=True)  # Hex color code for goal
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Icon name for goal

    # Metadata
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
        return f"<GoalModel(id={self.id}, title='{self.title}', type='{self.goal_type}', target={self.target_amount})>"


# Keep old model for migration compatibility
class BudgetModel(Base):
    """Legacy SQLAlchemy model for budgets (will be migrated to GoalModel)."""

    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category: Mapped[str] = mapped_column(
        String, nullable=False, unique=True, index=True
    )
    limit_amount: Mapped[float] = mapped_column(Float, nullable=False)
    spent_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
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
        return f"<BudgetModel(id={self.id}, category='{self.category}', limit={self.limit_amount})>"
