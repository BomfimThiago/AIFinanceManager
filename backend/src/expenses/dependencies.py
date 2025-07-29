"""
Expense dependencies for dependency injection.

This module contains dependency injection functions for the expenses module.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.repository import ExpenseRepository
from src.expenses.service import ExpenseService
from src.shared.dependencies import get_db


def get_expense_repository(db: AsyncSession = Depends(get_db)) -> ExpenseRepository:
    """Get expense repository instance."""
    return ExpenseRepository(db)


def get_expense_service(
    repository: ExpenseRepository = Depends(get_expense_repository),
) -> ExpenseService:
    """Get expense service instance."""
    return ExpenseService(repository)
