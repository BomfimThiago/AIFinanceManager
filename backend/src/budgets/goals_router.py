"""
Goals API router.

This module contains the FastAPI router for goals-related endpoints,
including the unified goals system and legacy budget compatibility.
"""

import logging

from fastapi import APIRouter, Body, Depends, HTTPException, Query

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.budgets.goals_dependencies import get_goals_service
from src.budgets.goals_service import GoalsService
from src.budgets.schemas import (
    Budget,  # Legacy support
    BudgetCreate,
    BudgetSummary,
    Goal,
    GoalCreate,
    GoalProgress,
    GoalSummary,
    GoalTemplateCreate,
    GoalUpdate,
)
from src.shared.constants import GoalStatus, GoalType, TimeHorizon
from src.shared.exceptions import DatabaseError, NotFoundError

logger = logging.getLogger(__name__)

# New goals router
goals_router = APIRouter(prefix="/api/goals", tags=["goals"])

# Legacy budgets router for backward compatibility
budgets_router = APIRouter(prefix="/api/budgets", tags=["budgets"])


# === GOALS ENDPOINTS (New System) ===

@goals_router.get("", response_model=list[Goal])
async def get_goals(
    goal_type: GoalType | None = Query(None, description="Filter by goal type"),
    status: GoalStatus | None = Query(None, description="Filter by status"),
    time_horizon: TimeHorizon | None = Query(None, description="Filter by time horizon"),
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Get all goals with optional filtering."""
    try:
        if goal_type:
            return await goals_service.get_goals_by_type(goal_type)
        elif status == GoalStatus.ACTIVE:
            return await goals_service.get_active_goals()
        else:
            return await goals_service.get_all_goals()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching goals: {e}")
        raise DatabaseError("get goals", details={"error": str(e)}) from e


@goals_router.get("/{goal_id}", response_model=Goal)
async def get_goal(
    goal_id: int,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Get goal by ID."""
    try:
        goal = await goals_service.get_goal_by_id(goal_id)
        if not goal:
            raise NotFoundError("Goal", str(goal_id))
        return goal
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error fetching goal {goal_id}: {e}")
        raise DatabaseError("get goal", details={"error": str(e)}) from e


@goals_router.post("", response_model=Goal)
async def create_goal(
    goal: GoalCreate,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Create a new goal."""
    try:
        logger.info(f"Creating goal for user {current_user.id}: {goal.model_dump()}")
        return await goals_service.create_goal(goal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error creating goal: {e}")
        raise DatabaseError("create goal", details={"error": str(e)}) from e


@goals_router.put("/{goal_id}", response_model=Goal)
async def update_goal(
    goal_id: int,
    goal: GoalUpdate,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Update an existing goal."""
    try:
        logger.info(f"Updating goal {goal_id}: {goal.model_dump()}")
        return await goals_service.update_goal(goal_id, goal)
    except NotFoundError:
        raise
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error updating goal {goal_id}: {e}")
        raise DatabaseError("update goal", details={"error": str(e)}) from e


@goals_router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Delete a goal."""
    try:
        logger.info(f"Deleting goal {goal_id}")
        success = await goals_service.delete_goal(goal_id)

        if not success:
            raise NotFoundError("Goal", str(goal_id))

        return {"message": "Goal deleted successfully"}
    except NotFoundError:
        raise
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error deleting goal {goal_id}: {e}")
        raise DatabaseError("delete goal", details={"error": str(e)}) from e


@goals_router.post("/{goal_id}/progress", response_model=Goal)
async def update_goal_progress(
    goal_id: int,
    progress: GoalProgress,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Update goal progress."""
    try:
        logger.info(f"Updating progress for goal {goal_id}: {progress.model_dump()}")
        return await goals_service.update_goal_progress(goal_id, progress)
    except NotFoundError:
        raise
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error updating goal progress: {e}")
        raise DatabaseError("update goal progress", details={"error": str(e)}) from e


@goals_router.put("/{goal_id}/progress", response_model=Goal)
async def set_goal_progress(
    goal_id: int,
    amount: float = Body(...),
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Set goal progress to specific amount."""
    try:
        logger.info(f"Setting progress for goal {goal_id} to: {amount}")
        return await goals_service.set_goal_progress(goal_id, amount)
    except NotFoundError:
        raise
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error setting goal progress: {e}")
        raise DatabaseError("set goal progress", details={"error": str(e)}) from e


@goals_router.get("/summary", response_model=GoalSummary)
async def get_goals_summary(
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive goals summary."""
    try:
        return await goals_service.get_goals_summary()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching goals summary: {e}")
        raise DatabaseError("get goals summary", details={"error": str(e)}) from e


@goals_router.post("/templates", response_model=Goal)
async def create_goal_from_template(
    template: GoalTemplateCreate,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Create goal from predefined template."""
    try:
        logger.info(f"Creating goal from template: {template.model_dump()}")
        return await goals_service.create_goal_from_template(template)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error creating goal from template: {e}")
        raise DatabaseError("create goal from template", details={"error": str(e)}) from e


@goals_router.get("/spending/budgets", response_model=dict[str, Budget])
async def get_spending_as_budgets(
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Get spending goals as budgets format (for frontend compatibility)."""
    try:
        return await goals_service.get_budgets_dict()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching spending goals as budgets: {e}")
        raise DatabaseError("get spending goals as budgets", details={"error": str(e)}) from e


# === LEGACY BUDGET ENDPOINTS (Backward Compatibility) ===

@budgets_router.get("", response_model=dict[str, Budget])
async def get_budgets(
    goals_service: GoalsService = Depends(get_goals_service),
):
    """Get all budgets (legacy compatibility)."""
    try:
        return await goals_service.get_budgets_dict()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching budgets: {e}")
        raise DatabaseError("get budgets", details={"error": str(e)}) from e


@budgets_router.post("", response_model=Budget)
async def create_budget(
    budget: BudgetCreate,
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Create or update a budget for a category (legacy compatibility)."""
    try:
        logger.info(f"Creating/updating budget for user {current_user.id}: {budget.model_dump()}")
        return await goals_service.create_or_update_budget(budget)
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error creating budget: {e}")
        raise DatabaseError("create budget", details={"error": str(e)}) from e


@budgets_router.put("/{category}/spent", response_model=Budget)
async def update_budget_spent(
    category: str,
    amount: float = Body(...),
    goals_service: GoalsService = Depends(get_goals_service),
    current_user: User = Depends(get_current_user),
):
    """Update the spent amount for a budget category (legacy compatibility)."""
    try:
        logger.info(f"Updating spent amount for category {category}: {amount}")
        return await goals_service.update_budget_spent(category, amount)
    except NotFoundError:
        # Create a default budget if it doesn't exist
        budget_create = BudgetCreate(category=category, limit=amount * 2)  # Set reasonable default
        await goals_service.create_or_update_budget(budget_create)
        return await goals_service.update_budget_spent(category, amount)
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error updating budget spent amount: {e}")
        raise DatabaseError("update budget spent", details={"error": str(e)}) from e


@budgets_router.get("/summary", response_model=BudgetSummary)
async def get_budget_summary(
    goals_service: GoalsService = Depends(get_goals_service),
):
    """Get budget summary with totals and category breakdown (legacy compatibility)."""
    try:
        return await goals_service.get_budget_summary()
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching budget summary: {e}")
        raise DatabaseError("get budget summary", details={"error": str(e)}) from e


# Export both routers
router = goals_router  # Primary router for new goals system
legacy_budgets_router = budgets_router  # Legacy router for backward compatibility
