"""
Expense Pydantic schemas.

This module contains Pydantic models for expense-related data validation
and serialization.
"""

from typing import Literal

from pydantic import Field

from src.shared.models import CustomModel


class ExpenseBase(CustomModel):
    """Base expense model with common fields."""

    date: str = Field(description="Date in YYYY-MM-DD format")
    amount: float = Field(gt=0, description="Amount must be positive")
    category: str = Field(min_length=1, description="Expense category")
    description: str = Field(description="Expense description")
    merchant: str = Field(description="Merchant or source")
    type: Literal["expense", "income"] = Field(description="Transaction type")
    source: Literal["ai-processed", "manual", "belvo-integration"] | None = Field(
        default="manual", description="Data source"
    )
    items: list[str] | None = Field(None, description="List of items")

    # Integration tracking
    transaction_id: str | None = Field(None, description="External transaction ID (e.g., Belvo)")

    # Multi-currency support
    original_currency: str | None = Field(
        default="EUR", description="Currency of the original amount"
    )
    amounts: dict[str, float] | None = Field(
        None, description="Amounts in all supported currencies"
    )
    exchange_rates: dict[str, float] | None = Field(
        None, description="Exchange rates at time of creation"
    )
    exchange_date: str | None = Field(
        None, description="Date when exchange rates were captured"
    )


class ExpenseCreate(ExpenseBase):
    """Schema for creating a new expense."""
    pass


class ExpenseUpdate(CustomModel):
    """Schema for updating an expense."""

    date: str | None = Field(None, description="Date in YYYY-MM-DD format")
    amount: float | None = Field(None, gt=0, description="Amount must be positive")
    category: str | None = Field(None, min_length=1, description="Expense category")
    description: str | None = Field(None, description="Expense description")
    merchant: str | None = Field(None, description="Merchant or source")
    type: Literal["expense", "income"] | None = Field(None, description="Transaction type")
    source: Literal["ai-processed", "manual", "belvo-integration"] | None = Field(
        None, description="Data source"
    )
    items: list[str] | None = Field(None, description="List of items")
    transaction_id: str | None = Field(None, description="External transaction ID (e.g., Belvo)")
    original_currency: str | None = Field(None, description="Original currency")


class Expense(ExpenseBase):
    """Complete expense model with ID."""

    id: int = Field(description="Expense ID")

    class Config:
        from_attributes = True


class ExpenseSummary(CustomModel):
    """Financial summary response model."""

    total_income: float = Field(description="Total income amount")
    total_expenses: float = Field(description="Total expenses amount")
    net_amount: float = Field(description="Net amount (income - expenses)")
    category_spending: dict[str, float] = Field(
        description="Spending by category"
    )


class CategoryData(CustomModel):
    """Category data for charts."""

    name: str = Field(description="Category name")
    value: float = Field(description="Category value/amount")
    color: str = Field(description="Category color code")


class MonthlyData(CustomModel):
    """Monthly data for charts."""

    month: str = Field(description="Month name")
    income: float = Field(description="Monthly income")
    expenses: float = Field(description="Monthly expenses")


class CategorySpendingResponse(CustomModel):
    """Response model for category spending."""

    currency: str = Field(description="Currency code")
    category_spending: dict[str, float] = Field(
        description="Spending amounts by category"
    )
