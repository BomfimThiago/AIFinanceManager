from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.models import Expense
from src.expenses.schemas import ExpenseCreate, ExpenseUpdate


class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, expense_data: ExpenseCreate, user_id: int) -> Expense:
        expense = Expense(
            user_id=user_id,
            **expense_data.model_dump(),
        )
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def get_by_id(self, expense_id: int, user_id: int) -> Expense | None:
        result = await self.db.execute(
            select(Expense).where(
                Expense.id == expense_id,
                Expense.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        category: str | None = None,
    ) -> list[Expense]:
        query = select(Expense).where(Expense.user_id == user_id)

        if start_date:
            query = query.where(Expense.expense_date >= start_date)
        if end_date:
            query = query.where(Expense.expense_date <= end_date)
        if category:
            query = query.where(Expense.category == category)

        query = query.order_by(Expense.expense_date.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update(self, expense: Expense, update_data: ExpenseUpdate) -> Expense:
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(expense, field, value)
        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def delete(self, expense: Expense) -> None:
        await self.db.delete(expense)
        await self.db.commit()
