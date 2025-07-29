"""
Insight API router.

This module contains the FastAPI router for AI insights-related endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.budgets.dependencies import get_budget_service
from src.budgets.service import BudgetService
from src.expenses.dependencies import get_expense_service
from src.expenses.service import ExpenseService
from src.insights.dependencies import get_insight_service
from src.insights.schemas import AIInsight, Insight, InsightSummary
from src.insights.service import InsightService
from src.shared.exceptions import DatabaseError, ExternalServiceError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("/generate", response_model=list[AIInsight])
async def generate_insights(
    insight_service: InsightService = Depends(get_insight_service),
    expense_service: ExpenseService = Depends(get_expense_service),
    budget_service: BudgetService = Depends(get_budget_service),
    current_user: User = Depends(get_current_user),
):
    """Generate AI insights based on current expenses and budgets."""
    try:
        logger.info(f"Generating insights for user {current_user.id}")

        # Get expenses and budgets
        expenses = await expense_service.get_all()
        budgets_dict = await budget_service.get_all()

        # Convert budgets to the format expected by AI service
        budget_format = {}
        for category, budget in budgets_dict.items():
            budget_format[category] = {
                "limit": budget.limit,
                "spent": budget.spent,
            }

        # Generate insights
        insights = await insight_service.generate_insights(expenses, budget_format)

        return insights
    except (DatabaseError, ExternalServiceError):
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise ExternalServiceError("AI service", "insights generation", details={"error": str(e)})


@router.get("", response_model=list[AIInsight])
async def get_insights(
    insight_service: InsightService = Depends(get_insight_service),
):
    """Get stored AI insights."""
    try:
        return await insight_service.get_all_as_ai_insights()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching insights: {e}")
        raise DatabaseError("get insights", details={"error": str(e)})


@router.get("/detailed", response_model=list[Insight])
async def get_detailed_insights(
    insight_service: InsightService = Depends(get_insight_service),
):
    """Get detailed stored insights with timestamps."""
    try:
        return await insight_service.get_all()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching detailed insights: {e}")
        raise DatabaseError("get detailed insights", details={"error": str(e)})


@router.get("/summary", response_model=InsightSummary)
async def get_insight_summary(
    insight_service: InsightService = Depends(get_insight_service),
):
    """Get insight summary with counts by type."""
    try:
        return await insight_service.get_summary()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching insight summary: {e}")
        raise DatabaseError("get insight summary", details={"error": str(e)})


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_insights(
    insight_service: InsightService = Depends(get_insight_service),
    current_user: User = Depends(get_current_user),
):
    """Delete all stored insights."""
    try:
        logger.info(f"Deleting all insights for user {current_user.id}")
        deleted_count = await insight_service.delete_all()
        logger.info(f"Deleted {deleted_count} insights")
        return
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error deleting insights: {e}")
        raise DatabaseError("delete insights", details={"error": str(e)})
