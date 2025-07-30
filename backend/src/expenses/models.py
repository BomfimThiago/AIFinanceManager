"""
Expense SQLAlchemy models.

This module contains the database models for expenses and related entities.
"""

import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class ExpenseType(str, enum.Enum):
    """Enum for expense types."""

    EXPENSE = "expense"
    INCOME = "income"


class ExpenseSource(str, enum.Enum):
    """Enum for expense sources."""

    AI_PROCESSED = "ai-processed"
    MANUAL = "manual"
    BELVO_INTEGRATION = "belvo-integration"


class ExpenseModel(Base):
    """SQLAlchemy model for expenses."""

    __tablename__ = "expenses"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Expense fields
    date: Mapped[str] = mapped_column(String, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    merchant: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[ExpenseType] = mapped_column(
        SQLEnum(ExpenseType), nullable=False, default=ExpenseType.EXPENSE
    )
    source: Mapped[ExpenseSource] = mapped_column(
        SQLEnum(ExpenseSource), nullable=False, default=ExpenseSource.MANUAL
    )
    items = mapped_column(JSON, nullable=True)

    # Integration tracking
    transaction_id: Mapped[str] = mapped_column(
        String, nullable=True, index=True, unique=True
    )  # Belvo transaction ID

    # Multi-currency support
    original_currency: Mapped[str] = mapped_column(
        String, nullable=False, default="EUR"
    )
    amounts = mapped_column(JSON, nullable=True)
    exchange_rates = mapped_column(JSON, nullable=True)
    exchange_date: Mapped[str] = mapped_column(String, nullable=True)

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
        return f"<ExpenseModel(id={self.id}, amount={self.amount}, category='{self.category}')>"
