from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.budgets import budget_model_to_pydantic
from app.api.expenses import expense_model_to_pydantic
from app.db.connection import get_db
from app.db.repositories import BudgetRepository, ExpenseRepository, InsightRepository
from app.models.expense import AIInsight
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/insights", response_model=List[AIInsight])
async def generate_insights(db: AsyncSession = Depends(get_db)):
    """Generate AI insights based on current expenses and budgets."""
    # Get data from database
    expense_repo = ExpenseRepository(db)
    budget_repo = BudgetRepository(db)
    insight_repo = InsightRepository(db)

    # Fetch expenses and budgets
    expense_models = await expense_repo.get_all()
    budget_models = await budget_repo.get_all()

    # Convert to Pydantic models for AI service
    expenses = [expense_model_to_pydantic(expense) for expense in expense_models]

    # Convert budgets to the format expected by AI service
    budgets_dict = {}
    for budget_model in budget_models:
        budgets_dict[budget_model.category] = {
            "limit": budget_model.limit_amount,
            "spent": budget_model.spent_amount,
        }

    # Generate insights using AI service
    insights = await ai_service.generate_insights(expenses, budgets_dict)

    # Store insights in database (optional - remove old insights and add new ones)
    await insight_repo.delete_all()  # Clear previous insights
    await insight_repo.create_multiple(insights)

    return insights


@router.get("/insights", response_model=List[AIInsight])
async def get_insights(db: AsyncSession = Depends(get_db)):
    """Get stored AI insights."""
    insight_repo = InsightRepository(db)
    insight_models = await insight_repo.get_all()

    # Convert to Pydantic models
    insights = []
    for insight_model in insight_models:
        insight = AIInsight(
            title=insight_model.title,
            message=insight_model.message,
            type=insight_model.type,
            actionable=insight_model.actionable,
        )
        insights.append(insight)

    return insights
