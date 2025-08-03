"""
Financial Goals Pydantic schemas.

This module contains the Pydantic schemas for the unified goals system,
including spending budgets, savings goals, and debt payoff goals.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from src.shared.constants import (
    BudgetPeriod,
    GoalRecurrence,
    GoalStatus,
    GoalType,
    TimeHorizon,
)


class GoalBase(BaseModel):
    """Base goal schema with common fields."""

    title: str = Field(..., min_length=1, max_length=200, description="Goal title")
    description: str | None = Field(None, description="Goal description")
    goal_type: GoalType = Field(..., description="Type of goal (spending, saving, debt)")
    time_horizon: TimeHorizon = Field(..., description="Time horizon (short, medium, long)")
    recurrence: GoalRecurrence = Field(..., description="Recurrence pattern")
    target_amount: float = Field(..., gt=0, description="Target amount")
    contribution_amount: float | None = Field(None, gt=0, description="Amount to save/pay per recurrence period")
    category: str | None = Field(None, description="Category for spending goals")
    target_date: str | None = Field(default=None, description="Target completion date (YYYY-MM-DD)")
    priority: int = Field(1, ge=1, le=3, description="Priority (1=high, 2=medium, 3=low)")
    auto_calculate: bool = Field(True, description="Auto-calculate progress from expenses")
    color: str | None = Field(default=None, description="Hex color code for visual identification")
    icon: str | None = Field(default=None, description="Icon name for visual identification")


class GoalCreate(GoalBase):
    """Schema for creating a new goal."""

    def model_post_init(self, __context=None) -> None:
        """Validate goal creation."""
        # Spending goals require a category
        if self.goal_type == GoalType.SPENDING and not self.category:
            raise ValueError("Spending goals must have a category")

        # Savings and debt goals should have target dates
        if self.goal_type in (GoalType.SAVING, GoalType.DEBT) and not self.target_date:
            raise ValueError("Savings and debt goals should have a target date")


class GoalUpdate(BaseModel):
    """Schema for updating a goal."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None)
    target_amount: float | None = Field(default=None, gt=0)
    contribution_amount: float | None = Field(default=None, gt=0)
    current_amount: float | None = Field(default=None, ge=0)
    target_date: str | None = Field(default=None)
    priority: int | None = Field(default=None, ge=1, le=3)
    status: GoalStatus | None = Field(default=None)
    auto_calculate: bool | None = Field(default=None)
    color: str | None = Field(default=None, description="Hex color code for visual identification")
    icon: str | None = Field(default=None, description="Icon name for visual identification")


class Goal(GoalBase):
    """Schema for goal response."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Goal ID")
    status: GoalStatus = Field(..., description="Goal status")
    current_amount: float = Field(..., ge=0, description="Current progress amount")
    start_date: str = Field(..., description="Goal start date")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    @computed_field
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.target_amount <= 0:
            return 0.0
        return min(100.0, (self.current_amount / self.target_amount) * 100)

    @computed_field
    @property
    def is_completed(self) -> bool:
        """Check if goal is completed."""
        return self.current_amount >= self.target_amount or self.status == GoalStatus.COMPLETED

    @computed_field
    @property
    def remaining_amount(self) -> float:
        """Calculate remaining amount to reach goal."""
        return max(0.0, self.target_amount - self.current_amount)


class GoalProgress(BaseModel):
    """Schema for goal progress tracking."""

    goal_id: int = Field(..., description="Goal ID")
    amount: float = Field(..., description="Progress amount to add/subtract")
    date: str | None = Field(default=None, description="Date of progress (defaults to today, YYYY-MM-DD format)")
    notes: str | None = Field(default=None, description="Optional notes about the progress")


class GoalSummary(BaseModel):
    """Schema for goals summary with breakdown by type."""

    model_config = ConfigDict(from_attributes=True)

    total_goals: int = Field(..., description="Total number of active goals")
    spending_goals: int = Field(..., description="Number of spending goals")
    saving_goals: int = Field(..., description="Number of saving goals")
    debt_goals: int = Field(..., description="Number of debt goals")
    completed_goals: int = Field(..., description="Number of completed goals")

    total_target: float = Field(..., description="Total target amount across all goals")
    total_progress: float = Field(..., description="Total progress amount across all goals")
    overall_progress_percentage: float = Field(..., description="Overall progress percentage")

    goals_by_type: dict[GoalType, list[Goal]] = Field(
        ..., description="Goals grouped by type"
    )
    goals_by_priority: dict[int, list[Goal]] = Field(
        ..., description="Goals grouped by priority"
    )


class GoalTemplateCreate(BaseModel):
    """Schema for creating goals from templates."""

    template_type: str = Field(..., description="Template type (monthly_budget, emergency_fund, etc.)")
    category: str | None = Field(default=None, description="Category for spending goals")
    amount: float = Field(..., gt=0, description="Goal amount")
    months: int | None = Field(default=None, gt=0, description="Number of months for savings goals")


# Legacy Budget schemas for backward compatibility
class BudgetBase(BaseModel):
    """Legacy base budget schema with common fields."""

    category: str = Field(..., description="Budget category name")
    limit: float = Field(..., ge=0, description="Budget limit amount")
    period: BudgetPeriod = Field(BudgetPeriod.MONTHLY, description="Budget period")


class BudgetCreate(BudgetBase):
    """Legacy schema for creating a new budget."""

    pass


class BudgetUpdate(BaseModel):
    """Legacy schema for updating a budget."""

    limit: float | None = Field(default=None, ge=0, description="Budget limit amount")
    spent: float | None = Field(default=None, ge=0, description="Budget spent amount")


class Budget(BudgetBase):
    """Legacy schema for budget response."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Budget ID")
    spent: float = Field(..., ge=0, description="Amount spent in this category")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class BudgetSummary(BaseModel):
    """Legacy schema for budget summary with category breakdown."""

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
