"""
Goals repository for database operations.

This module contains the repository class for goals-related database operations
including the unified goals system (spending, saving, debt goals).
"""

from datetime import date, datetime

from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.budgets.models import GoalModel
from src.budgets.schemas import GoalCreate, GoalProgress, GoalUpdate
from src.shared.constants import GoalRecurrence, GoalStatus, GoalType, TimeHorizon
from src.shared.repository import BaseRepository


class GoalsRepository(BaseRepository[GoalModel, GoalCreate, GoalUpdate]):
    """Repository for goals database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(GoalModel, db)
        self.db = db

    async def get_by_type(self, goal_type: GoalType) -> list[GoalModel]:
        """Get all goals by type."""
        result = await self.db.execute(
            select(GoalModel).where(GoalModel.goal_type == goal_type.value)
        )
        return list(result.scalars().all())

    async def get_active_goals(self) -> list[GoalModel]:
        """Get all active goals."""
        result = await self.db.execute(
            select(GoalModel).where(GoalModel.status == GoalStatus.ACTIVE.value)
        )
        return list(result.scalars().all())

    async def get_spending_goals(self) -> list[GoalModel]:
        """Get all spending (budget) goals."""
        result = await self.db.execute(
            select(GoalModel).where(
                and_(
                    GoalModel.goal_type == GoalType.SPENDING.value,
                    GoalModel.status == GoalStatus.ACTIVE.value
                )
            )
        )
        return list(result.scalars().all())

    async def get_by_category(self, category: str) -> GoalModel | None:
        """Get spending goal by category."""
        result = await self.db.execute(
            select(GoalModel).where(
                and_(
                    GoalModel.goal_type == GoalType.SPENDING.value,
                    GoalModel.category == category
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_goals_by_priority(self, priority: int) -> list[GoalModel]:
        """Get goals by priority level."""
        result = await self.db.execute(
            select(GoalModel).where(GoalModel.priority == priority)
        )
        return list(result.scalars().all())

    async def get_goals_by_time_horizon(self, time_horizon: TimeHorizon) -> list[GoalModel]:
        """Get goals by time horizon."""
        result = await self.db.execute(
            select(GoalModel).where(GoalModel.time_horizon == time_horizon.value)
        )
        return list(result.scalars().all())

    async def get_goals_due_soon(self, days: int = 30) -> list[GoalModel]:
        """Get goals due within specified days."""
        cutoff_date = date.today() + datetime.timedelta(days=days)
        result = await self.db.execute(
            select(GoalModel).where(
                and_(
                    GoalModel.target_date.is_not(None),
                    GoalModel.target_date <= cutoff_date,
                    GoalModel.status == GoalStatus.ACTIVE.value
                )
            )
        )
        return list(result.scalars().all())

    async def get_completed_goals(self, limit: int = 10) -> list[GoalModel]:
        """Get recently completed goals."""
        result = await self.db.execute(
            select(GoalModel)
            .where(GoalModel.status == GoalStatus.COMPLETED.value)
            .order_by(GoalModel.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create_goal(self, goal_data: GoalCreate) -> GoalModel:
        """Create a new goal."""
        # Convert string date to date object if provided
        target_date = None
        if goal_data.target_date:
            try:
                target_date = datetime.strptime(goal_data.target_date, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("target_date must be in YYYY-MM-DD format")

        db_goal = GoalModel(
            title=goal_data.title,
            description=goal_data.description,
            goal_type=goal_data.goal_type.value,
            time_horizon=goal_data.time_horizon.value,
            recurrence=goal_data.recurrence.value,
            target_amount=goal_data.target_amount,
            category=goal_data.category,
            target_date=target_date,
            priority=goal_data.priority,
            auto_calculate=goal_data.auto_calculate,
            color=goal_data.color,
            icon=goal_data.icon,
        )
        self.db.add(db_goal)
        await self.db.commit()
        await self.db.refresh(db_goal)
        return db_goal

    async def update_goal_progress(self, goal_id: int, progress: GoalProgress) -> GoalModel:
        """Update goal progress."""
        result = await self.db.execute(
            update(GoalModel)
            .where(GoalModel.id == goal_id)
            .values(
                current_amount=GoalModel.current_amount + progress.amount,
                updated_at=func.now()
            )
            .returning(GoalModel)
        )
        await self.db.commit()
        return result.scalar_one()

    async def set_goal_progress(self, goal_id: int, amount: float) -> GoalModel:
        """Set goal progress to specific amount."""
        result = await self.db.execute(
            update(GoalModel)
            .where(GoalModel.id == goal_id)
            .values(
                current_amount=amount,
                updated_at=func.now()
            )
            .returning(GoalModel)
        )
        await self.db.commit()
        return result.scalar_one()

    async def update_goal_status(self, goal_id: int, status: GoalStatus) -> GoalModel:
        """Update goal status."""
        result = await self.db.execute(
            update(GoalModel)
            .where(GoalModel.id == goal_id)
            .values(
                status=status.value,
                updated_at=func.now()
            )
            .returning(GoalModel)
        )
        await self.db.commit()
        return result.scalar_one()

    async def delete_goal(self, goal_id: int) -> bool:
        """Delete a goal."""
        result = await self.db.execute(
            delete(GoalModel).where(GoalModel.id == goal_id)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_goals_summary(self) -> dict:
        """Get comprehensive goals summary."""
        # Count goals by type
        result = await self.db.execute(
            select(
                GoalModel.goal_type,
                GoalModel.status,
                func.count(GoalModel.id).label('count'),
                func.sum(GoalModel.target_amount).label('total_target'),
                func.sum(GoalModel.current_amount).label('total_progress')
            )
            .group_by(GoalModel.goal_type, GoalModel.status)
        )

        summary_data = {}
        for row in result:
            goal_type = row.goal_type
            status = row.status
            if goal_type not in summary_data:
                summary_data[goal_type] = {}
            summary_data[goal_type][status] = {
                'count': row.count,
                'total_target': row.total_target or 0,
                'total_progress': row.total_progress or 0
            }

        return summary_data

    # Legacy budget compatibility methods
    async def create_or_update_budget(self, category: str, limit: float) -> GoalModel:
        """Create or update a spending goal (legacy budget compatibility)."""
        existing = await self.get_by_category(category)

        if existing:
            # Update existing spending goal
            result = await self.db.execute(
                update(GoalModel)
                .where(GoalModel.id == existing.id)
                .values(
                    target_amount=limit,
                    updated_at=func.now()
                )
                .returning(GoalModel)
            )
            await self.db.commit()
            return result.scalar_one()
        else:
            # Create new spending goal
            goal_data = GoalCreate(
                title=f"{category} Budget",
                description=f"Monthly spending limit for {category}",
                goal_type=GoalType.SPENDING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=limit,
                category=category,
                priority=1,
                auto_calculate=True
            )
            return await self.create_goal(goal_data)

    async def update_budget_spent(self, category: str, spent_amount: float) -> GoalModel:
        """Update spent amount for a category (legacy budget compatibility)."""
        goal = await self.get_by_category(category)
        if not goal:
            raise ValueError(f"No spending goal found for category: {category}")

        return await self.set_goal_progress(goal.id, spent_amount)

    async def get_budgets_dict(self) -> dict:
        """Get spending goals as budgets dictionary (legacy compatibility)."""
        spending_goals = await self.get_spending_goals()

        result = {}
        for goal in spending_goals:
            result[goal.category] = {
                'id': goal.id,
                'category': goal.category,
                'limit': goal.target_amount,
                'spent': goal.current_amount,
                'created_at': goal.created_at,
                'updated_at': goal.updated_at
            }

        return result
