"""
Expense service for business logic.

This module contains the service class for expense-related business operations.
"""

import logging

from src.currency.service import currency_service
from src.expenses.models import ExpenseModel
from src.expenses.repository import ExpenseRepository
from src.expenses.schemas import Expense, ExpenseCreate, ExpenseUpdate
from src.shared.constants import Currency
from src.utils.calculations import (
    calculate_category_spending,
    calculate_net_amount,
    calculate_total_expenses,
    calculate_total_income,
    prepare_category_data,
    prepare_monthly_data,
)

logger = logging.getLogger(__name__)


class ExpenseService:
    """Service for expense business logic."""

    def __init__(self, repository: ExpenseRepository):
        self.repository = repository

    def _model_to_schema(self, expense_model: ExpenseModel) -> Expense:
        """Convert SQLAlchemy model to Pydantic schema."""
        return Expense(
            id=getattr(expense_model, "id", 0),
            date=expense_model.date,
            amount=expense_model.amount,
            category=expense_model.category,
            description=expense_model.description,
            merchant=expense_model.merchant,
            type=expense_model.type.value,
            source=expense_model.source.value if expense_model.source else "manual",
            items=expense_model.items,
            original_currency=expense_model.original_currency,
            amounts=expense_model.amounts,
            exchange_rates=expense_model.exchange_rates,
            exchange_date=expense_model.exchange_date,
        )

    async def get_all(
        self,
        month: int | None = None,
        year: int | None = None,
        expense_type: str | None = None,
    ) -> list[Expense]:
        """Get all expenses with optional filtering."""
        if month is not None or year is not None or expense_type is not None:
            expense_models = await self.repository.get_by_filters(
                month=month, year=year, expense_type=expense_type
            )
        else:
            expense_models = await self.repository.get_all()

        return [self._model_to_schema(expense) for expense in expense_models]

    async def get_by_id(self, expense_id: int) -> Expense | None:
        """Get expense by ID."""
        expense_model = await self.repository.get_by_id(expense_id)
        if expense_model:
            return self._model_to_schema(expense_model)
        return None

    async def create(self, expense_data: ExpenseCreate) -> Expense:
        """Create a new expense."""
        # Process multi-currency data
        expense_with_currencies = await self._process_expense_currencies(expense_data)

        # Create in database
        expense_model = await self.repository.create(expense_with_currencies)
        return self._model_to_schema(expense_model)

    async def create_bulk(self, expenses_data: list[ExpenseCreate]) -> list[Expense]:
        """Create multiple expenses."""
        created_expenses = []

        for expense_data in expenses_data:
            try:
                expense = await self.create(expense_data)
                created_expenses.append(expense)
            except Exception as e:
                logger.error(
                    f"Failed to create expense: {expense_data.description} - {e}"
                )
                continue

        return created_expenses

    async def update(
        self, expense_id: int, expense_data: ExpenseUpdate
    ) -> Expense | None:
        """Update an expense."""
        # If we're updating amount or currency, reprocess currencies
        if (
            expense_data.amount is not None
            or expense_data.original_currency is not None
        ):
            # Get existing expense to merge data
            existing = await self.repository.get_by_id(expense_id)
            if not existing:
                return None

            # Create ExpenseCreate from update data with existing values as fallback
            expense_create = ExpenseCreate(
                date=expense_data.date or existing.date,
                amount=expense_data.amount or existing.amount,
                category=expense_data.category or existing.category,
                description=expense_data.description or existing.description,
                merchant=expense_data.merchant or existing.merchant,
                type=expense_data.type or existing.type.value,
                source=expense_data.source or existing.source.value,
                items=expense_data.items or existing.items,
                original_currency=expense_data.original_currency
                or existing.original_currency,
            )

            # Process currencies
            expense_with_currencies = await self._process_expense_currencies(
                expense_create
            )

            # Convert back to update schema
            update_data = ExpenseUpdate(
                date=expense_with_currencies.date,
                amount=expense_with_currencies.amount,
                category=expense_with_currencies.category,
                description=expense_with_currencies.description,
                merchant=expense_with_currencies.merchant,
                type=expense_with_currencies.type,
                source=expense_with_currencies.source,
                items=expense_with_currencies.items,
                original_currency=expense_with_currencies.original_currency,
            )
        else:
            update_data = expense_data

        expense_model = await self.repository.update(expense_id, update_data)
        if expense_model:
            return self._model_to_schema(expense_model)
        return None

    async def delete(self, expense_id: int) -> bool:
        """Delete an expense."""
        return await self.repository.delete(expense_id)

    async def get_summary(self) -> dict:
        """Get expense summary data."""
        expense_models = await self.repository.get_all()
        expenses = [self._model_to_schema(expense) for expense in expense_models]

        total_income = calculate_total_income(expenses)
        total_expenses = calculate_total_expenses(expenses)
        net_amount = calculate_net_amount(expenses)

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_amount": net_amount,
            "category_spending": calculate_category_spending(expenses),
        }

    async def get_category_chart_data(self, categories: dict[str, str]) -> list[dict]:
        """Get category data for pie chart."""
        expense_models = await self.repository.get_all()
        expenses = [self._model_to_schema(expense) for expense in expense_models]
        return prepare_category_data(expenses, categories)

    async def get_monthly_chart_data(self) -> list[dict]:
        """Get monthly data for line chart."""
        expense_models = await self.repository.get_all()
        expenses = [self._model_to_schema(expense) for expense in expense_models]
        return prepare_monthly_data(expenses)

    async def get_category_spending(
        self,
        currency: str = "EUR",
        month: int | None = None,
        year: int | None = None,
    ) -> dict:
        """Get actual spending amounts by category with currency conversion."""
        # Get filtered expenses
        if month is not None or year is not None:
            expense_models = await self.repository.get_by_date_filter(
                month=month, year=year
            )
        else:
            expense_models = await self.repository.get_all()

        expenses = [self._model_to_schema(expense) for expense in expense_models]

        # Calculate spending by category with currency conversion
        category_spending = {}
        target_currency = Currency(currency)

        for expense in expenses:
            if expense.type == "expense":
                # Use pre-calculated amounts if available for the target currency
                if expense.amounts and target_currency.value in expense.amounts:
                    amount = expense.amounts[target_currency.value]
                else:
                    # Convert using current rates if no pre-calculated amount
                    original_currency = Currency(expense.original_currency or "EUR")
                    current_rates = await currency_service.get_current_rates()
                    amount = await currency_service.convert_amount(
                        expense.amount,
                        original_currency,
                        target_currency,
                        current_rates,
                    )

                if expense.category not in category_spending:
                    category_spending[expense.category] = 0
                category_spending[expense.category] += amount

        return {"currency": currency, "category_spending": category_spending}

    async def _process_expense_currencies(
        self, expense: ExpenseCreate
    ) -> ExpenseCreate:
        """Process expense to include multi-currency data."""
        try:
            # Get the original currency (default to EUR if not specified)
            original_currency = Currency(expense.original_currency or "EUR")

            # Get current exchange rates
            exchange_rates = await currency_service.get_current_rates()

            # Convert the amount to all supported currencies
            amounts = await currency_service.convert_to_all_currencies(
                expense.amount, original_currency, exchange_rates
            )

            # Create updated expense with currency data
            expense_data = expense.model_dump()
            expense_data.update(
                {
                    "original_currency": original_currency.value,
                    "amounts": amounts,
                    "exchange_rates": exchange_rates,
                    "exchange_date": expense.date,
                }
            )

            return ExpenseCreate(**expense_data)

        except Exception as e:
            logger.error(f"Error processing expense currencies: {e}")
            # Return original expense if currency processing fails
            return expense
