"""
Budget service for business logic.

This module contains the service class for budget-related business operations.
"""

import logging

from src.budgets.models import BudgetModel
from src.budgets.repository import BudgetRepository
from src.budgets.schemas import Budget, BudgetCreate, BudgetSummary

logger = logging.getLogger(__name__)


class BudgetService:
    """Service for budget business logic."""

    def __init__(self, repository: BudgetRepository):
        self.repository = repository

    def _model_to_schema(self, budget_model: BudgetModel) -> Budget:
        """Convert SQLAlchemy model to Pydantic schema."""
        return Budget(
            id=getattr(budget_model, "id", 0),
            category=budget_model.category,
            limit=budget_model.limit_amount,
            spent=budget_model.spent_amount,
            created_at=budget_model.created_at,
            updated_at=budget_model.updated_at,
        )

    async def get_all(self) -> dict[str, Budget]:
        """Get all budgets as a dictionary keyed by category."""
        budget_models = await self.repository.get_all()

        # Convert to dictionary format expected by frontend
        result = {}
        for budget_model in budget_models:
            result[budget_model.category] = Budget(
                id=getattr(budget_model, "id", 0),
                category=budget_model.category,
                limit=budget_model.limit_amount,
                spent=budget_model.spent_amount,
                created_at=budget_model.created_at,
                updated_at=budget_model.updated_at,
            )

        return result

    async def get_by_category(self, category: str) -> Budget | None:
        """Get budget by category."""
        budget_model = await self.repository.get_by_category(category)
        if budget_model:
            return self._model_to_schema(budget_model)
        return None

    async def create_or_update(self, budget_data: BudgetCreate) -> Budget:
        """Create or update a budget."""
        budget_model = await self.repository.create_or_update(budget_data)
        return self._model_to_schema(budget_model)

    async def update_spent_amount(
        self, category: str, spent_amount: float
    ) -> Budget | None:
        """Update spent amount for a budget category."""
        try:
            # Get existing budget or create a default one
            existing_budget = await self.repository.get_by_category(category)
            if not existing_budget:
                # Create a default budget if it doesn't exist
                budget_create = BudgetCreate(category=category, limit=0.0)
                existing_budget = await self.repository.create_or_update(budget_create)

            # Update spent amount
            budget_model = await self.repository.update_spent_amount(
                category, spent_amount
            )

            if budget_model:
                return self._model_to_schema(budget_model)
            return None
        except Exception as e:
            logger.error(f"Error updating spent amount for category {category}: {e}")
            return None

    async def delete_by_category(self, category: str) -> bool:
        """Delete a budget by category."""
        return await self.repository.delete_by_category(category)

    async def get_summary(self) -> BudgetSummary:
        """Get budget summary with totals and category breakdown."""
        budget_models = await self.repository.get_all()

        categories = {}
        total_limit = 0.0
        total_spent = 0.0

        for budget_model in budget_models:
            budget = self._model_to_schema(budget_model)
            categories[budget_model.category] = budget
            total_limit += budget_model.limit_amount
            total_spent += budget_model.spent_amount

        return BudgetSummary(
            total_budgets=len(budget_models),
            total_limit=total_limit,
            total_spent=total_spent,
            categories=categories,
        )
