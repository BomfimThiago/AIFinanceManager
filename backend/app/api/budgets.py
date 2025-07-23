from typing import Dict
from fastapi import APIRouter
from app.models.expense import Budget, BudgetCreate

router = APIRouter()

# In-memory storage (in production, use a database)
budgets_db: Dict[str, Budget] = {}


@router.get("/budgets")
async def get_budgets():
    """Get all budgets."""
    return budgets_db


@router.post("/budgets")
async def create_budget(budget: BudgetCreate):
    """Create or update a budget for a category."""
    existing_budget = budgets_db.get(budget.category)
    spent = existing_budget.spent if existing_budget else 0.0
    
    budgets_db[budget.category] = Budget(
        limit=budget.limit,
        spent=spent
    )
    
    return budgets_db[budget.category]


@router.put("/budgets/{category}/spent")
async def update_budget_spent(category: str, amount: float):
    """Update the spent amount for a budget category."""
    if category not in budgets_db:
        budgets_db[category] = Budget(limit=0.0, spent=0.0)
    
    budgets_db[category].spent += amount
    return budgets_db[category]


@router.delete("/budgets/{category}")
async def delete_budget(category: str):
    """Delete a budget category."""
    if category in budgets_db:
        del budgets_db[category]
    return {"message": "Budget deleted successfully"}