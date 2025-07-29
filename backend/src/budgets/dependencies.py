"""
Budget dependencies.

This module contains the FastAPI dependencies for budget operations.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.budgets.repository import BudgetRepository
from src.budgets.service import BudgetService
from src.database import get_database_session


async def get_budget_repository(
    session: AsyncSession = Depends(get_database_session),
) -> BudgetRepository:
    """Get budget repository dependency."""
    return BudgetRepository(session)


async def get_budget_service(
    repository: BudgetRepository = Depends(get_budget_repository),
) -> BudgetService:
    """Get budget service dependency."""
    return BudgetService(repository)
