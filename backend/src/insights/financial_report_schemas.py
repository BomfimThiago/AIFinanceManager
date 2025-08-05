"""
Financial Report schemas for comprehensive analytics.

This module contains the Pydantic schemas for financial report data structures.
"""

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class TrendDirection(str, Enum):
    """Trend direction enum."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class FinancialHealthGrade(str, Enum):
    """Financial health grade enum."""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class ExecutiveSummary(BaseModel):
    """Executive summary data."""
    period_start: date
    period_end: date
    total_income: float
    total_expenses: float
    net_savings: float
    net_savings_percentage: float
    average_daily_spending: float
    total_transactions: int
    financial_health_score: int
    quick_insights: list[str]


class MonthlyTrendData(BaseModel):
    """Monthly trend data point."""
    month: str
    year: int
    income: float
    expenses: float
    net_savings: float
    transaction_count: int


class CategoryAnalysis(BaseModel):
    """Category analysis data."""
    category: str
    amount: float
    percentage: float
    transaction_count: int
    trend: TrendDirection
    budget_limit: float | None = None
    budget_percentage: float | None = None
    average_transaction: float


class MerchantAnalysis(BaseModel):
    """Merchant analysis data."""
    merchant: str
    total_amount: float
    transaction_count: int
    percentage_of_total: float
    average_transaction: float
    last_transaction_date: date


class TransactionPatterns(BaseModel):
    """Transaction patterns analysis."""
    average_transaction_size: float
    largest_transaction: float
    smallest_transaction: float
    most_common_day: str
    transactions_by_day: dict[str, int]
    recurring_expenses: list[MerchantAnalysis]


class BudgetPerformance(BaseModel):
    """Budget performance analysis."""
    overall_adherence_score: float
    categories_over_budget: list[str]
    categories_under_budget: list[str]
    projected_month_end_status: dict[str, float]
    total_budget: float
    total_spent: float


class FinancialHealthMetrics(BaseModel):
    """Financial health metrics."""
    savings_rate: float
    expense_ratio_fixed: float
    expense_ratio_variable: float
    emergency_fund_months: float
    debt_to_income_ratio: float | None = None
    overall_grade: FinancialHealthGrade


class GoalProgress(BaseModel):
    """Goal progress data."""
    goal_id: int
    title: str
    target_amount: float
    current_amount: float
    progress_percentage: float
    projected_completion_date: date | None = None
    required_monthly_savings: float
    is_on_track: bool


class GoalAlignment(BaseModel):
    """Goal alignment analysis."""
    active_goals: list[GoalProgress]
    total_monthly_required: float
    current_monthly_savings: float
    savings_gap: float
    recommendations: list[str]


class RecommendationPriority(str, Enum):
    """Recommendation priority enum."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Recommendation(BaseModel):
    """Individual recommendation."""
    title: str
    description: str
    impact: str
    priority: RecommendationPriority
    potential_savings: float | None = None
    difficulty: str
    timeframe: str


class ActionPlan(BaseModel):
    """Action plan with priorities."""
    top_priorities: list[Recommendation]
    monthly_savings_potential: float
    next_steps: list[str]


class ComprehensiveFinancialReport(BaseModel):
    """Complete financial report."""
    executive_summary: ExecutiveSummary
    monthly_trends: list[MonthlyTrendData]
    category_analysis: list[CategoryAnalysis]
    merchant_analysis: list[MerchantAnalysis]
    transaction_patterns: TransactionPatterns
    budget_performance: BudgetPerformance
    financial_health: FinancialHealthMetrics
    goal_alignment: GoalAlignment
    ai_insights: list[str]
    recommendations: list[Recommendation]
    action_plan: ActionPlan
    generated_at: datetime = Field(default_factory=datetime.now)
