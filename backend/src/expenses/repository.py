from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.currency.service import CurrencyService, get_currency_service
from src.expenses.models import Expense
from src.expenses.schemas import ExpenseCreate, ExpenseUpdate


class ExpenseRepository:
    def __init__(self, db: AsyncSession, currency_service: CurrencyService | None = None):
        self.db = db
        self.currency_service = currency_service or get_currency_service()

    async def create(self, expense_data: ExpenseCreate, user_id: int) -> Expense:
        # Convert amount to all supported currencies using historical rates
        converted = await self.currency_service.convert_amount(
            amount=expense_data.amount,
            from_currency=expense_data.currency.value,
            expense_date=expense_data.expense_date,
        )

        expense = Expense(
            user_id=user_id,
            **expense_data.model_dump(),
            amount_usd=converted["amount_usd"],
            amount_eur=converted["amount_eur"],
            amount_brl=converted["amount_brl"],
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
