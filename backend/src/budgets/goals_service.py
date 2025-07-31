"""
Goals service for business logic.

This module contains the service class for goals-related business operations
including the unified goals system and legacy budget compatibility.
"""

import logging
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional

from src.budgets.models import GoalModel
from src.budgets.goals_repository import GoalsRepository
from src.budgets.schemas import (
    Goal, GoalCreate, GoalUpdate, GoalProgress, GoalSummary, GoalTemplateCreate,
    Budget, BudgetCreate, BudgetSummary  # Legacy support
)
from src.shared.constants import GoalType, GoalStatus, TimeHorizon, GoalRecurrence

logger = logging.getLogger(__name__)


class GoalsService:
    """Service for goals business logic."""

    def __init__(self, repository: GoalsRepository):
        self.repository = repository

    def _model_to_schema(self, goal_model: GoalModel) -> Goal:
        """Convert SQLAlchemy model to Pydantic schema."""
        return Goal(
            id=goal_model.id,
            title=goal_model.title,
            description=goal_model.description,
            goal_type=GoalType(goal_model.goal_type),
            time_horizon=TimeHorizon(goal_model.time_horizon),
            recurrence=GoalRecurrence(goal_model.recurrence),
            status=GoalStatus(goal_model.status),
            target_amount=goal_model.target_amount,
            current_amount=goal_model.current_amount,
            category=goal_model.category,
            target_date=goal_model.target_date.isoformat() if goal_model.target_date else None,
            start_date=goal_model.start_date.isoformat() if goal_model.start_date else None,
            priority=goal_model.priority,
            auto_calculate=goal_model.auto_calculate,
            created_at=goal_model.created_at,
            updated_at=goal_model.updated_at,
        )

    async def get_all_goals(self) -> List[Goal]:
        """Get all goals."""
        goal_models = await self.repository.get_all()
        return [self._model_to_schema(model) for model in goal_models]

    async def get_active_goals(self) -> List[Goal]:
        """Get all active goals."""
        goal_models = await self.repository.get_active_goals()
        return [self._model_to_schema(model) for model in goal_models]

    async def get_goals_by_type(self, goal_type: GoalType) -> List[Goal]:
        """Get goals by type."""
        goal_models = await self.repository.get_by_type(goal_type)
        return [self._model_to_schema(model) for model in goal_models]

    async def get_spending_goals(self) -> List[Goal]:
        """Get all spending (budget) goals."""
        goal_models = await self.repository.get_spending_goals()
        return [self._model_to_schema(model) for model in goal_models]

    async def get_goal_by_id(self, goal_id: int) -> Optional[Goal]:
        """Get goal by ID."""
        goal_model = await self.repository.get_by_id(goal_id)
        return self._model_to_schema(goal_model) if goal_model else None

    async def create_goal(self, goal_data: GoalCreate) -> Goal:
        """Create a new goal."""
        # Auto-set start_date if not provided
        if hasattr(goal_data, 'start_date') and not goal_data.start_date:
            goal_data.start_date = date.today()

        # Auto-generate title if not specific enough
        if not goal_data.title or goal_data.title == goal_data.goal_type.value:
            goal_data.title = self._generate_goal_title(goal_data)

        goal_model = await self.repository.create_goal(goal_data)
        return self._model_to_schema(goal_model)

    async def update_goal(self, goal_id: int, goal_data: GoalUpdate) -> Goal:
        """Update an existing goal."""
        goal_model = await self.repository.update(goal_id, goal_data)
        
        # Check if goal is completed
        if goal_model.current_amount >= goal_model.target_amount:
            await self.repository.update_goal_status(goal_id, GoalStatus.COMPLETED)
            goal_model = await self.repository.get_by_id(goal_id)

        return self._model_to_schema(goal_model)

    async def delete_goal(self, goal_id: int) -> bool:
        """Delete a goal."""
        return await self.repository.delete_goal(goal_id)

    async def update_goal_progress(self, goal_id: int, progress: GoalProgress) -> Goal:
        """Update goal progress."""
        goal_model = await self.repository.update_goal_progress(goal_id, progress)
        
        # Check if goal is completed
        if goal_model.current_amount >= goal_model.target_amount:
            await self.repository.update_goal_status(goal_id, GoalStatus.COMPLETED)
            goal_model = await self.repository.get_by_id(goal_id)

        return self._model_to_schema(goal_model)

    async def set_goal_progress(self, goal_id: int, amount: float) -> Goal:
        """Set goal progress to specific amount."""
        goal_model = await self.repository.set_goal_progress(goal_id, amount)
        
        # Check if goal is completed
        if goal_model.current_amount >= goal_model.target_amount:
            await self.repository.update_goal_status(goal_id, GoalStatus.COMPLETED)
            goal_model = await self.repository.get_by_id(goal_id)

        return self._model_to_schema(goal_model)

    async def get_goals_summary(self) -> GoalSummary:
        """Get comprehensive goals summary."""
        # Get all active goals
        active_goals = await self.get_active_goals()
        completed_goals = await self.repository.get_completed_goals()

        # Group by type
        goals_by_type = {goal_type: [] for goal_type in GoalType}
        for goal in active_goals:
            goals_by_type[goal.goal_type].append(goal)

        # Group by priority
        goals_by_priority = {1: [], 2: [], 3: []}
        for goal in active_goals:
            goals_by_priority[goal.priority].append(goal)

        # Calculate totals
        total_target = sum(goal.target_amount for goal in active_goals)
        total_progress = sum(goal.current_amount for goal in active_goals)
        overall_progress_percentage = (
            (total_progress / total_target * 100) if total_target > 0 else 0
        )

        return GoalSummary(
            total_goals=len(active_goals),
            spending_goals=len(goals_by_type[GoalType.SPENDING]),
            saving_goals=len(goals_by_type[GoalType.SAVING]),
            debt_goals=len(goals_by_type[GoalType.DEBT]),
            completed_goals=len(completed_goals),
            total_target=total_target,
            total_progress=total_progress,
            overall_progress_percentage=overall_progress_percentage,
            goals_by_type=goals_by_type,
            goals_by_priority=goals_by_priority,
        )

    async def create_goal_from_template(self, template: GoalTemplateCreate) -> Goal:
        """Create goal from predefined template."""
        if template.template_type == "monthly_budget":
            goal_data = GoalCreate(
                title=f"{template.category} Budget",
                description=f"Monthly spending limit for {template.category}",
                goal_type=GoalType.SPENDING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=template.amount,
                category=template.category,
                priority=1,
                auto_calculate=True,
            )
        elif template.template_type == "emergency_fund":
            months = template.months or 6
            target_date = date.today() + timedelta(days=months * 30)
            goal_data = GoalCreate(
                title="Emergency Fund",
                description=f"Save {months} months of expenses for emergencies",
                goal_type=GoalType.SAVING,
                time_horizon=TimeHorizon.MEDIUM,
                recurrence=GoalRecurrence.ONE_TIME,
                target_amount=template.amount,
                target_date=target_date.isoformat(),
                priority=1,
                auto_calculate=False,
            )
        elif template.template_type == "vacation_fund":
            months = template.months or 12
            target_date = date.today() + timedelta(days=months * 30)
            goal_data = GoalCreate(
                title="Vacation Fund",
                description="Save for vacation expenses",
                goal_type=GoalType.SAVING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.ONE_TIME,
                target_amount=template.amount,
                target_date=target_date.isoformat(),
                priority=2,
                auto_calculate=False,
            )
        else:
            raise ValueError(f"Unknown template type: {template.template_type}")

        return await self.create_goal(goal_data)

    def _generate_goal_title(self, goal_data: GoalCreate) -> str:
        """Generate a descriptive title for a goal."""
        if goal_data.goal_type == GoalType.SPENDING and goal_data.category:
            return f"{goal_data.category} Budget"
        elif goal_data.goal_type == GoalType.SAVING:
            return f"Save ${goal_data.target_amount:,.0f}"
        elif goal_data.goal_type == GoalType.DEBT:
            return f"Pay Off ${goal_data.target_amount:,.0f} Debt"
        else:
            return f"{goal_data.goal_type.value.title()} Goal"

    # Legacy budget compatibility methods
    async def get_budgets_dict(self) -> Dict[str, Budget]:
        """Get spending goals as budgets dictionary (legacy compatibility)."""
        budgets_dict = await self.repository.get_budgets_dict()
        
        result = {}
        for category, budget_data in budgets_dict.items():
            result[category] = Budget(
                id=budget_data['id'],
                category=category,
                limit=budget_data['limit'],
                spent=budget_data['spent'],
                period="monthly",  # Default for legacy compatibility
                created_at=budget_data['created_at'],
                updated_at=budget_data['updated_at'],
            )
        
        return result

    async def create_or_update_budget(self, budget_data: BudgetCreate) -> Budget:
        """Create or update budget (legacy compatibility)."""
        goal_model = await self.repository.create_or_update_budget(
            budget_data.category, budget_data.limit
        )
        
        return Budget(
            id=goal_model.id,
            category=goal_model.category,
            limit=goal_model.target_amount,
            spent=goal_model.current_amount,
            period="monthly",
            created_at=goal_model.created_at,
            updated_at=goal_model.updated_at,
        )

    async def update_budget_spent(self, category: str, spent_amount: float) -> Budget:
        """Update budget spent amount (legacy compatibility)."""
        goal_model = await self.repository.update_budget_spent(category, spent_amount)
        
        return Budget(
            id=goal_model.id,
            category=goal_model.category,
            limit=goal_model.target_amount,
            spent=goal_model.current_amount,
            period="monthly",
            created_at=goal_model.created_at,
            updated_at=goal_model.updated_at,
        )

    async def get_budget_summary(self) -> BudgetSummary:
        """Get budget summary (legacy compatibility)."""
        budgets = await self.get_budgets_dict()
        
        total_limit = sum(budget.limit for budget in budgets.values())
        total_spent = sum(budget.spent for budget in budgets.values())
        
        return BudgetSummary(
            total_budgets=len(budgets),
            total_limit=total_limit,
            total_spent=total_spent,
            categories=budgets,
        )