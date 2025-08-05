"""
Insight API router.

This module contains the FastAPI router for AI insights-related endpoints.
"""

import logging

from fastapi import APIRouter, Depends, status

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.budgets.dependencies import get_budget_service
from src.budgets.service import BudgetService
from src.expenses.dependencies import get_expense_service
from src.expenses.service import ExpenseService
from src.insights.dependencies import get_insight_service
from src.insights.financial_report_dependencies import get_financial_report_service
from src.insights.financial_report_schemas import ComprehensiveFinancialReport
from src.insights.financial_report_service import FinancialReportService
from src.insights.schemas import AIInsight, Insight, InsightSummary
from src.insights.service import InsightService
from src.shared.exceptions import DatabaseError, ExternalServiceError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("/generate", response_model=list[AIInsight])
async def generate_insights(
    start_date: str | None = None,
    end_date: str | None = None,
    insight_service: InsightService = Depends(get_insight_service),
    expense_service: ExpenseService = Depends(get_expense_service),
    budget_service: BudgetService = Depends(get_budget_service),
    current_user: User = Depends(get_current_user),
):
    """Generate AI insights based on current expenses and budgets with optional date filtering."""
    try:
        logger.info(
            f"🚀 INSIGHTS ENDPOINT CALLED - Generating insights for user {current_user.id} (dates: {start_date} to {end_date})"
        )

        # Get expenses and budgets
        expenses = await expense_service.get_all()
        budgets_dict = await budget_service.get_all()

        # Filter expenses by date range if provided
        if start_date or end_date:
            from datetime import datetime

            filtered_expenses = []
            for expense in expenses:
                expense_date = datetime.fromisoformat(expense.date).date()

                # Check start date
                if start_date:
                    start_date_obj = datetime.fromisoformat(start_date).date()
                    if expense_date < start_date_obj:
                        continue

                # Check end date
                if end_date:
                    end_date_obj = datetime.fromisoformat(end_date).date()
                    if expense_date > end_date_obj:
                        continue

                filtered_expenses.append(expense)

            expenses = filtered_expenses

        logger.info(
            f"📊 Retrieved {len(expenses)} expenses and {len(budgets_dict)} budgets"
        )

        # Convert budgets to the format expected by AI service
        budget_format = {}
        for category, budget in budgets_dict.items():
            budget_format[category] = {
                "limit": budget.limit,
                "spent": budget.spent,
            }

        # Generate insights
        insights = await insight_service.generate_insights(expenses, budget_format)

        logger.info(
            f"🎯 INSIGHTS ENDPOINT RESPONSE - Returning {len(insights)} insights"
        )
        for i, insight in enumerate(insights):
            logger.info(f"  📝 Insight {i + 1}: {insight.title}")

        return insights
    except (DatabaseError, ExternalServiceError):
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise ExternalServiceError(
            "AI service", "insights generation", details={"error": str(e)}
        ) from e


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
        raise DatabaseError("get insights", details={"error": str(e)}) from e


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
        raise DatabaseError("get detailed insights", details={"error": str(e)}) from e


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
        raise DatabaseError("get insight summary", details={"error": str(e)}) from e


@router.get("/financial-report", response_model=ComprehensiveFinancialReport)
async def get_financial_report(
    start_date: str | None = None,
    end_date: str | None = None,
    financial_report_service: FinancialReportService = Depends(
        get_financial_report_service
    ),
    current_user: User = Depends(get_current_user),
):
    """Generate comprehensive financial report with analytics for specified date range."""
    try:
        logger.info(
            f"Generating financial report for user {current_user.id} (dates: {start_date} to {end_date})"
        )
        report = await financial_report_service.generate_comprehensive_report(
            start_date, end_date
        )
        logger.info("Financial report generated successfully")
        return report
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error generating financial report: {e}")
        raise DatabaseError(
            "generate financial report", details={"error": str(e)}
        ) from e


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
        raise DatabaseError("delete insights", details={"error": str(e)}) from e
