"""
Budget repository for database operations.

This module contains the repository class for budget-related database operations.
"""

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.budgets.models import BudgetModel
from src.budgets.schemas import BudgetCreate, BudgetUpdate
from src.shared.repository import BaseRepository


class BudgetRepository(BaseRepository[BudgetModel, BudgetCreate, BudgetUpdate]):
    """Repository for budget database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(BudgetModel, db)
        self.db = db

    async def get_by_category(self, category: str) -> BudgetModel | None:
        """Get budget by category."""
        result = await self.db.execute(
            select(BudgetModel).where(BudgetModel.category == category)
        )
        return result.scalar_one_or_none()

    async def create_or_update(self, budget_data: BudgetCreate) -> BudgetModel:
        """Create or update a budget."""
        existing = await self.get_by_category(budget_data.category)

        if existing:
            # Update existing budget
            result = await self.db.execute(
                update(BudgetModel)
                .where(BudgetModel.category == budget_data.category)
                .values(limit_amount=budget_data.limit)
                .returning(BudgetModel)
            )
            await self.db.commit()
            return result.scalar_one()
        else:
            # Create new budget
            db_budget = BudgetModel(
                category=budget_data.category,
                limit_amount=budget_data.limit,
                spent_amount=0.0,
            )
            self.db.add(db_budget)
            await self.db.commit()
            await self.db.refresh(db_budget)
            return db_budget

    async def update_spent_amount(
        self, category: str, spent_amount: float
    ) -> BudgetModel | None:
        """Update spent amount for a budget."""
        result = await self.db.execute(
            update(BudgetModel)
            .where(BudgetModel.category == category)
            .values(spent_amount=spent_amount)
            .returning(BudgetModel)
        )
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete_by_category(self, category: str) -> bool:
        """Delete a budget by category."""
        result = await self.db.execute(
            delete(BudgetModel).where(BudgetModel.category == category)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_total_limits(self) -> float:
        """Get total budget limits across all categories."""
        budgets = await self.get_all()
        return sum(budget.limit_amount for budget in budgets)

    async def get_total_spent(self) -> float:
        """Get total spent amount across all categories."""
        budgets = await self.get_all()
        return sum(budget.spent_amount for budget in budgets)
