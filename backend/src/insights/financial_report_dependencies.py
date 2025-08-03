"""
Financial Report Service dependencies.

This module provides dependency injection for the financial report service.
"""

from fastapi import Depends

from src.budgets.dependencies import get_budget_service
from src.budgets.goals_dependencies import get_goals_service
from src.budgets.goals_service import GoalsService
from src.budgets.service import BudgetService
from src.expenses.dependencies import get_expense_service
from src.expenses.service import ExpenseService
from src.insights.financial_report_service import FinancialReportService


def get_financial_report_service(
    expense_service: ExpenseService = Depends(get_expense_service),
    budget_service: BudgetService = Depends(get_budget_service),
    goals_service: GoalsService = Depends(get_goals_service),
) -> FinancialReportService:
    """Get financial report service instance."""
    return FinancialReportService(expense_service, budget_service, goals_service)