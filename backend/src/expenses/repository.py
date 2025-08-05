"""
Expense repository for database operations.

This module contains the repository class for expense-related database operations.
"""

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.models import ExpenseModel, ExpenseType
from src.expenses.schemas import ExpenseCreate, ExpenseUpdate
from src.shared.repository import BaseRepository


class ExpenseRepository(BaseRepository[ExpenseModel, ExpenseCreate, ExpenseUpdate]):
    """Repository for expense database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(ExpenseModel, db)

    async def get_by_date_filter(
        self, month: int | None = None, year: int | None = None
    ) -> list[ExpenseModel]:
        """Get expenses filtered by month and/or year."""
        query = select(self.model)

        conditions = []

        if year is not None:
            # Extract year from date string (assuming YYYY-MM-DD format)
            conditions.append(self.model.date.like(f"{year}-%"))

        if month is not None:
            # Extract month from date string
            month_str = f"{month:02d}"
            if year is not None:
                conditions.append(self.model.date.like(f"{year}-{month_str}-%"))
            else:
                conditions.append(self.model.date.like(f"%-{month_str}-%"))

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(self.model.date.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_filters(
        self,
        month: int | None = None,
        year: int | None = None,
        expense_type: str | None = None,
        category: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        search: str | None = None,
    ) -> list[ExpenseModel]:
        """Get expenses filtered by various criteria."""
        query = select(self.model)

        conditions = []

        if year is not None:
            # Extract year from date string (assuming YYYY-MM-DD format)
            conditions.append(self.model.date.like(f"{year}-%"))

        if month is not None:
            # Extract month from date string
            month_str = f"{month:02d}"
            if year is not None:
                conditions.append(self.model.date.like(f"{year}-{month_str}-%"))
            else:
                conditions.append(self.model.date.like(f"%-{month_str}-%"))

        if expense_type is not None:
            try:
                # Convert string to ExpenseType enum
                expense_type_enum = ExpenseType(expense_type)
                conditions.append(self.model.type == expense_type_enum)
            except ValueError:
                # Invalid expense type, return empty result
                return []

        if category is not None:
            conditions.append(self.model.category == category)

        if start_date is not None:
            conditions.append(self.model.date >= start_date)

        if end_date is not None:
            conditions.append(self.model.date <= end_date)

        if search is not None:
            # Search in description and merchant fields
            search_term = f"%{search}%"
            search_conditions = or_(
                self.model.description.ilike(search_term),
                self.model.merchant.ilike(search_term),
            )
            conditions.append(search_conditions)

        if conditions:
            query = query.where(and_(*conditions))

        query = query.order_by(self.model.date.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_category(self, category: str) -> list[ExpenseModel]:
        """Get expenses by category."""
        query = select(self.model).where(self.model.category == category)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_type(self, expense_type: str) -> list[ExpenseModel]:
        """Get expenses by type (expense/income)."""
        query = select(self.model).where(self.model.type == expense_type)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_source(self, source: str) -> list[ExpenseModel]:
        """Get expenses by source."""
        query = select(self.model).where(self.model.source == source)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_transaction_id(self, transaction_id: str) -> ExpenseModel | None:
        """Get expense by transaction ID."""
        query = select(self.model).where(self.model.transaction_id == transaction_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def transaction_id_exists(self, transaction_id: str) -> bool:
        """Check if transaction ID already exists."""
        expense = await self.get_by_transaction_id(transaction_id)
        return expense is not None

    async def update_by_transaction_id(
        self, transaction_id: str, update_data: ExpenseUpdate
    ) -> ExpenseModel | None:
        """Update expense by transaction ID."""
        expense = await self.get_by_transaction_id(transaction_id)
        if not expense:
            return None

        return await self.update(expense.id, update_data)
