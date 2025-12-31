"""Tests for expense endpoints."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.categories.models import UserCategoryPreference
from src.expenses.models import Expense


@pytest.mark.asyncio
async def test_create_expense(client: AsyncClient, test_user: User):
    """Create a new expense."""
    # Mock the currency service
    with patch("src.expenses.repository.get_currency_service") as mock_currency:
        mock_service = AsyncMock()
        mock_service.convert_amount.return_value = {
            "amount_usd": Decimal("5.50"),
            "amount_eur": Decimal("5.00"),
            "amount_brl": Decimal("27.50"),
        }
        mock_currency.return_value = mock_service

        expense_data = {
            "description": "Coffee",
            "amount": 5.50,
            "currency": "USD",
            "category": "dining",
            "expenseDate": datetime.now(UTC).isoformat(),
        }

        response = await client.post("/api/v1/expenses", json=expense_data)

        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Coffee"
        assert data["category"] == "dining"
        assert float(data["amount"]) == 5.50


@pytest.mark.asyncio
async def test_get_expenses_with_date_filter(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
):
    """Get expenses filtered by date range."""
    today = datetime.utcnow()
    yesterday = today - timedelta(days=1)
    last_week = today - timedelta(days=7)

    # Create expenses with different dates
    expense_today = Expense(
        user_id=test_user.id,
        description="Today expense",
        amount=Decimal("10.00"),
        currency="USD",
        category="groceries",
        expense_date=today,
    )
    expense_old = Expense(
        user_id=test_user.id,
        description="Old expense",
        amount=Decimal("20.00"),
        currency="USD",
        category="groceries",
        expense_date=last_week,
    )
    db_session.add_all([expense_today, expense_old])
    await db_session.commit()

    # Filter by date range (yesterday to today)
    response = await client.get(
        "/api/v1/expenses",
        params={
            "start_date": yesterday.isoformat(),
            "end_date": today.isoformat(),
        },
    )

    assert response.status_code == 200
    expenses = response.json()
    assert len(expenses) == 1
    assert expenses[0]["description"] == "Today expense"


@pytest.mark.asyncio
async def test_update_expense_category_creates_preference(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_expense: Expense,
):
    """Updating expense category triggers preference learning."""
    # Update category from groceries to dining
    response = await client.patch(
        f"/api/v1/expenses/{test_expense.id}",
        json={"category": "dining"},
    )

    assert response.status_code == 200
    assert response.json()["category"] == "dining"

    # Verify preference was created
    result = await db_session.execute(
        select(UserCategoryPreference).where(
            UserCategoryPreference.user_id == test_user.id,
            UserCategoryPreference.target_category == "dining",
        )
    )
    preference = result.scalar_one_or_none()

    assert preference is not None
    assert preference.item_name_pattern == "test item"  # normalized
    assert preference.original_category == "groceries"


@pytest.mark.asyncio
async def test_expense_has_converted_amounts(
    client: AsyncClient,
    test_expense: Expense,
):
    """Expense includes converted currency amounts."""
    response = await client.get(f"/api/v1/expenses/{test_expense.id}")

    assert response.status_code == 200
    data = response.json()

    # Should have converted amounts from fixture
    assert data["amountUsd"] is not None
    assert data["amountEur"] is not None
    assert data["amountBrl"] is not None
