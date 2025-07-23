from typing import Dict
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Budget, BudgetCreate
from app.db.connection import get_db
from app.db.repositories import BudgetRepository

router = APIRouter()


def budget_model_to_pydantic(budget_model) -> Budget:
    """Convert SQLAlchemy model to Pydantic model."""
    return Budget(
        limit=budget_model.limit_amount,
        spent=budget_model.spent_amount
    )


@router.get("/budgets")
async def get_budgets(db: AsyncSession = Depends(get_db)):
    """Get all budgets."""
    repo = BudgetRepository(db)
    budget_models = await repo.get_all()
    
    # Convert to dictionary format expected by frontend
    result = {}
    for budget_model in budget_models:
        result[budget_model.category] = budget_model_to_pydantic(budget_model)
    
    return result


@router.post("/budgets")
async def create_budget(budget: BudgetCreate, db: AsyncSession = Depends(get_db)):
    """Create or update a budget for a category."""
    repo = BudgetRepository(db)
    budget_model = await repo.create_or_update(budget)
    return budget_model_to_pydantic(budget_model)


@router.put("/budgets/{category}/spent")
async def update_budget_spent(category: str, amount: float, db: AsyncSession = Depends(get_db)):
    """Update the spent amount for a budget category."""
    repo = BudgetRepository(db)
    
    # Get existing budget or create a default one
    existing_budget = await repo.get_by_category(category)
    if not existing_budget:
        # Create a default budget if it doesn't exist
        budget_create = BudgetCreate(category=category, limit=0.0)
        existing_budget = await repo.create_or_update(budget_create)
    
    # Update spent amount
    new_spent = existing_budget.spent_amount + amount
    budget_model = await repo.update_spent_amount(category, new_spent)
    
    if not budget_model:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return budget_model_to_pydantic(budget_model)


@router.delete("/budgets/{category}")
async def delete_budget(category: str, db: AsyncSession = Depends(get_db)):
    """Delete a budget category."""
    repo = BudgetRepository(db)
    success = await repo.delete(category)
    
    if not success:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return {"message": "Budget deleted successfully"}