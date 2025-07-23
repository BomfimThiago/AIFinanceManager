from typing import List
from fastapi import APIRouter
from app.models.expense import AIInsight
from app.services.ai_service import ai_service
from app.api.expenses import expenses_db, budgets_db

router = APIRouter()


@router.post("/insights", response_model=List[AIInsight])
async def generate_insights():
    """Generate AI insights based on current expenses and budgets."""
    # Convert budgets to the format expected by AI service
    budgets_dict = {category: {"limit": budget.limit, "spent": budget.spent} 
                   for category, budget in budgets_db.items()}
    
    insights = await ai_service.generate_insights(expenses_db, budgets_dict)
    return insights