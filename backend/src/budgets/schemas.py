"""
Budget Pydantic schemas.

This module contains the Pydantic schemas for budget data validation.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.shared.constants import BudgetPeriod


class BudgetBase(BaseModel):
    """Base budget schema with common fields."""

    category: str = Field(..., description="Budget category name")
    limit: float = Field(..., ge=0, description="Budget limit amount")
    period: BudgetPeriod = Field(BudgetPeriod.MONTHLY, description="Budget period")


class BudgetCreate(BudgetBase):
    """Schema for creating a new budget."""

    pass


class BudgetUpdate(BaseModel):
    """Schema for updating a budget."""

    limit: float | None = Field(None, ge=0, description="Budget limit amount")
    spent: float | None = Field(None, ge=0, description="Budget spent amount")


class Budget(BudgetBase):
    """Schema for budget response."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Budget ID")
    spent: float = Field(..., ge=0, description="Amount spent in this category")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class BudgetSummary(BaseModel):
    """Schema for budget summary with category breakdown."""

    model_config = ConfigDict(from_attributes=True)

    total_budgets: int = Field(..., description="Total number of budgets")
    total_limit: float = Field(
        ..., description="Total budget limit across all categories"
    )
    total_spent: float = Field(
        ..., description="Total amount spent across all categories"
    )
    categories: dict[str, Budget] = Field(
        ..., description="Budget breakdown by category"
    )
