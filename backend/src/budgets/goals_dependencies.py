"""
Goals service dependencies.

This module contains dependency providers for the goals service.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.budgets.goals_repository import GoalsRepository
from src.budgets.goals_service import GoalsService
from src.database import get_database_session


async def get_goals_repository(
    db: AsyncSession = Depends(get_database_session),
) -> GoalsRepository:
    """Get goals repository instance."""
    return GoalsRepository(db)


async def get_goals_service(
    repository: GoalsRepository = Depends(get_goals_repository),
) -> GoalsService:
    """Get goals service instance."""
    return GoalsService(repository)