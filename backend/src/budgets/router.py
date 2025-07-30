"""
Budget API router.

This module contains the FastAPI router for budget-related endpoints.
"""

import logging

from fastapi import APIRouter, Body, Depends

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.budgets.dependencies import get_budget_service
from src.budgets.schemas import Budget, BudgetCreate, BudgetSummary
from src.budgets.service import BudgetService
from src.shared.exceptions import DatabaseError, NotFoundError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("", response_model=dict[str, Budget])
async def get_budgets(
    budget_service: BudgetService = Depends(get_budget_service),
):
    """Get all budgets."""
    try:
        return await budget_service.get_all()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        raise DatabaseError("get budgets", details={"error": str(e)})


@router.post("", response_model=Budget)
async def create_budget(
    budget: BudgetCreate,
    budget_service: BudgetService = Depends(get_budget_service),
    current_user: User = Depends(get_current_user),
):
    """Create or update a budget for a category."""
    try:
        logger.info(
            f"Creating/updating budget for user {current_user.id}: {budget.model_dump()}"
        )
        return await budget_service.create_or_update(budget)
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error creating budget: {e}")
        raise DatabaseError("create budget", details={"error": str(e)})


@router.put("/{category}/spent", response_model=Budget)
async def update_budget_spent(
    category: str,
    amount: float = Body(...),
    budget_service: BudgetService = Depends(get_budget_service),
    current_user: User = Depends(get_current_user),
):
    """Update the spent amount for a budget category."""
    try:
        logger.info(f"Updating spent amount for category {category}: {amount}")

        # Get existing budget to calculate new spent amount
        existing_budget = await budget_service.get_by_category(category)
        if not existing_budget:
            # Create a default budget if it doesn't exist
            budget_create = BudgetCreate(category=category, limit=0.0)
            existing_budget = await budget_service.create_or_update(budget_create)

        # Update spent amount (adding to existing spent)
        new_spent = existing_budget.spent + amount
        updated_budget = await budget_service.update_spent_amount(category, new_spent)

        if not updated_budget:
            raise NotFoundError("Budget", category)

        return updated_budget
    except (NotFoundError, DatabaseError):
        raise
    except Exception as e:
        logger.error(f"Error updating budget spent amount: {e}")
        raise DatabaseError("update budget spent", details={"error": str(e)})


@router.delete("/{category}")
async def delete_budget(
    category: str,
    budget_service: BudgetService = Depends(get_budget_service),
    current_user: User = Depends(get_current_user),
):
    """Delete a budget category."""
    try:
        logger.info(f"Deleting budget for category {category}")
        success = await budget_service.delete_by_category(category)

        if not success:
            raise NotFoundError("Budget", category)

        return {"message": "Budget deleted successfully"}
    except (NotFoundError, DatabaseError):
        raise
    except Exception as e:
        logger.error(f"Error deleting budget: {e}")
        raise DatabaseError("delete budget", details={"error": str(e)})


@router.get("/summary", response_model=BudgetSummary)
async def get_budget_summary(
    budget_service: BudgetService = Depends(get_budget_service),
):
    """Get budget summary with totals and category breakdown."""
    try:
        return await budget_service.get_summary()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching budget summary: {e}")
        raise DatabaseError("get budget summary", details={"error": str(e)})
