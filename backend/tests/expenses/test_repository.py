"""
Unit tests for the expenses repository module.

Tests the ExpenseRepository class methods for database operations
including expense creation, retrieval, filtering, and updates.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.models import ExpenseModel, ExpenseType, ExpenseSource
from src.expenses.repository import ExpenseRepository
from src.expenses.schemas import ExpenseCreate, ExpenseUpdate


@pytest.mark.unit
@pytest.mark.expenses
class TestExpenseRepository:
    """Test cases for ExpenseRepository."""

    @pytest.fixture
    def expense_repository(self, db_session: AsyncSession) -> ExpenseRepository:
        """Create an ExpenseRepository instance for testing."""
        return ExpenseRepository(db_session)

    @pytest.fixture
    def sample_expense_create(self) -> ExpenseCreate:
        """Create sample expense creation data."""
        return ExpenseCreate(
            date="2024-01-15",
            amount=25.50,
            category="GROCERIES",
            description="Weekly grocery shopping",
            merchant="SuperMarket XYZ",
            type="expense",
            source="manual",
            items=["apples", "bread", "milk"],
            original_currency="EUR",
        )

    @pytest.fixture
    def sample_income_create(self) -> ExpenseCreate:
        """Create sample income creation data."""
        return ExpenseCreate(
            date="2024-01-01",
            amount=3000.00,
            category="SALARY",
            description="Monthly salary",
            merchant="Tech Company Ltd",
            type="income",
            source="manual",
            original_currency="EUR",
        )

    @pytest.mark.asyncio
    async def test_create_expense(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test creating a new expense."""
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        assert created_expense.id is not None
        assert created_expense.date == sample_expense_create.date
        assert created_expense.amount == sample_expense_create.amount
        assert created_expense.category == sample_expense_create.category
        assert created_expense.description == sample_expense_create.description
        assert created_expense.merchant == sample_expense_create.merchant
        assert created_expense.type == ExpenseType.EXPENSE
        assert created_expense.source == ExpenseSource.MANUAL
        assert created_expense.items == sample_expense_create.items
        assert created_expense.original_currency == "EUR"
        assert created_expense.created_at is not None

    @pytest.mark.asyncio
    async def test_create_income(
        self, expense_repository: ExpenseRepository, sample_income_create: ExpenseCreate
    ):
        """Test creating a new income."""
        created_income = await expense_repository.create(sample_income_create.model_dump())
        
        assert created_income.id is not None
        assert created_income.type == ExpenseType.INCOME
        assert created_income.amount == 3000.00
        assert created_income.category == "SALARY"

    @pytest.mark.asyncio
    async def test_get_by_id(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test retrieving expense by ID."""
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        retrieved_expense = await expense_repository.get_by_id(created_expense.id)
        
        assert retrieved_expense is not None
        assert retrieved_expense.id == created_expense.id
        assert retrieved_expense.amount == created_expense.amount

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, expense_repository: ExpenseRepository):
        """Test retrieving expense by non-existent ID."""
        expense = await expense_repository.get_by_id(99999)
        
        assert expense is None

    @pytest.mark.asyncio
    async def test_update_expense(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test updating expense information."""
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        update_data = ExpenseUpdate(
            amount=30.00,
            description="Updated grocery shopping",
            category="FOOD",
        )
        
        updated_expense = await expense_repository.update(created_expense.id, update_data)
        
        assert updated_expense is not None
        assert updated_expense.amount == 30.00
        assert updated_expense.description == "Updated grocery shopping"
        assert updated_expense.category == "FOOD"
        assert updated_expense.merchant == created_expense.merchant  # Unchanged

    @pytest.mark.asyncio
    async def test_update_expense_not_found(self, expense_repository: ExpenseRepository):
        """Test updating non-existent expense."""
        update_data = ExpenseUpdate(amount=50.00)
        
        updated_expense = await expense_repository.update(99999, update_data)
        
        assert updated_expense is None

    @pytest.mark.asyncio
    async def test_delete_expense(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test deleting an expense."""
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        success = await expense_repository.delete(created_expense.id)
        
        assert success is True
        
        # Verify expense is deleted
        deleted_expense = await expense_repository.get_by_id(created_expense.id)
        assert deleted_expense is None

    @pytest.mark.asyncio
    async def test_delete_expense_not_found(self, expense_repository: ExpenseRepository):
        """Test deleting non-existent expense."""
        success = await expense_repository.delete(99999)
        
        assert success is False

    @pytest.mark.asyncio
    async def test_list_expenses(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test listing expenses with pagination."""
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        expenses, _ = await expense_repository.get_multi(skip=0, limit=10)
        
        assert len(expenses) >= 1
        assert any(expense.id == created_expense.id for expense in expenses)

    @pytest.mark.asyncio
    async def test_count_expenses(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test counting total expenses."""
        await expense_repository.create(sample_expense_create.model_dump())
        
        count = await expense_repository.count()
        
        assert count >= 1

    @pytest.mark.asyncio
    async def test_get_by_date_filter_year(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test filtering expenses by year."""
        await expense_repository.create(sample_expense_create.model_dump())
        
        # Test filtering by year 2024
        expenses_2024 = await expense_repository.get_by_date_filter(year=2024)
        assert len(expenses_2024) >= 1
        assert all("2024" in expense.date for expense in expenses_2024)
        
        # Test filtering by non-existent year
        expenses_2025 = await expense_repository.get_by_date_filter(year=2025)
        assert len(expenses_2025) == 0

    @pytest.mark.asyncio
    async def test_get_by_date_filter_month_year(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test filtering expenses by month and year."""
        await expense_repository.create(sample_expense_create.model_dump())
        
        # Test filtering by January 2024
        expenses_jan_2024 = await expense_repository.get_by_date_filter(month=1, year=2024)
        assert len(expenses_jan_2024) >= 1
        assert all("2024-01" in expense.date for expense in expenses_jan_2024)
        
        # Test filtering by non-existent month
        expenses_dec_2024 = await expense_repository.get_by_date_filter(month=12, year=2024)
        assert len(expenses_dec_2024) == 0

    @pytest.mark.asyncio
    async def test_get_by_category(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test filtering expenses by category."""
        await expense_repository.create(sample_expense_create.model_dump())
        
        groceries_expenses = await expense_repository.get_by_category("GROCERIES")
        assert len(groceries_expenses) >= 1
        assert all(expense.category == "GROCERIES" for expense in groceries_expenses)
        
        # Test non-existent category
        transport_expenses = await expense_repository.get_by_category("TRANSPORT")
        assert len(transport_expenses) == 0

    @pytest.mark.asyncio
    async def test_get_by_type(
        self, expense_repository: ExpenseRepository, 
        sample_expense_create: ExpenseCreate,
        sample_income_create: ExpenseCreate
    ):
        """Test filtering expenses by type."""
        await expense_repository.create(sample_expense_create.model_dump())
        await expense_repository.create(sample_income_create.model_dump())
        
        expenses = await expense_repository.get_by_type("expense")
        assert len(expenses) >= 1
        assert all(expense.type == ExpenseType.EXPENSE for expense in expenses)
        
        incomes = await expense_repository.get_by_type("income")
        assert len(incomes) >= 1
        assert all(expense.type == ExpenseType.INCOME for expense in incomes)

    @pytest.mark.asyncio
    async def test_get_by_source(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test filtering expenses by source."""
        await expense_repository.create(sample_expense_create.model_dump())
        
        manual_expenses = await expense_repository.get_by_source("manual")
        assert len(manual_expenses) >= 1
        assert all(expense.source == ExpenseSource.MANUAL for expense in manual_expenses)

    @pytest.mark.asyncio
    async def test_get_by_transaction_id(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test retrieving expense by transaction ID."""
        sample_expense_create.transaction_id = "TXN123456"
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        retrieved_expense = await expense_repository.get_by_transaction_id("TXN123456")
        
        assert retrieved_expense is not None
        assert retrieved_expense.id == created_expense.id
        assert retrieved_expense.transaction_id == "TXN123456"

    @pytest.mark.asyncio
    async def test_get_by_transaction_id_not_found(self, expense_repository: ExpenseRepository):
        """Test retrieving expense by non-existent transaction ID."""
        expense = await expense_repository.get_by_transaction_id("NONEXISTENT")
        
        assert expense is None

    @pytest.mark.asyncio
    async def test_transaction_id_exists(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test checking if transaction ID exists."""
        sample_expense_create.transaction_id = "TXN789"
        await expense_repository.create(sample_expense_create.model_dump())
        
        assert await expense_repository.transaction_id_exists("TXN789") is True
        assert await expense_repository.transaction_id_exists("NONEXISTENT") is False

    @pytest.mark.asyncio
    async def test_update_by_transaction_id(
        self, expense_repository: ExpenseRepository, sample_expense_create: ExpenseCreate
    ):
        """Test updating expense by transaction ID."""
        sample_expense_create.transaction_id = "TXN999"
        created_expense = await expense_repository.create(sample_expense_create.model_dump())
        
        update_data = ExpenseUpdate(amount=100.00, description="Updated via transaction ID")
        
        updated_expense = await expense_repository.update_by_transaction_id("TXN999", update_data)
        
        assert updated_expense is not None
        assert updated_expense.id == created_expense.id
        assert updated_expense.amount == 100.00
        assert updated_expense.description == "Updated via transaction ID"

    @pytest.mark.asyncio
    async def test_update_by_transaction_id_not_found(self, expense_repository: ExpenseRepository):
        """Test updating expense by non-existent transaction ID."""
        update_data = ExpenseUpdate(amount=50.00)
        
        updated_expense = await expense_repository.update_by_transaction_id("NONEXISTENT", update_data)
        
        assert updated_expense is None

    @pytest.mark.asyncio
    async def test_get_by_filters_comprehensive(
        self, expense_repository: ExpenseRepository, 
        sample_expense_create: ExpenseCreate,
        sample_income_create: ExpenseCreate
    ):
        """Test comprehensive filtering with multiple criteria."""
        await expense_repository.create(sample_expense_create.model_dump())
        await expense_repository.create(sample_income_create.model_dump())
        
        # Test filtering by type
        expenses = await expense_repository.get_by_filters(expense_type="expense")
        assert len(expenses) >= 1
        assert all(expense.type == ExpenseType.EXPENSE for expense in expenses)
        
        # Test filtering by category
        grocery_expenses = await expense_repository.get_by_filters(category="GROCERIES")
        assert len(grocery_expenses) >= 1
        assert all(expense.category == "GROCERIES" for expense in grocery_expenses)
        
        # Test search functionality
        search_results = await expense_repository.get_by_filters(search="grocery")
        assert len(search_results) >= 1
        assert any("grocery" in expense.description.lower() for expense in search_results)
        
        # Test date range filtering
        date_filtered = await expense_repository.get_by_filters(
            start_date="2024-01-01", end_date="2024-01-31"
        )
        assert len(date_filtered) >= 1
        assert all("2024-01" in expense.date for expense in date_filtered)

    @pytest.mark.asyncio
    async def test_get_by_filters_invalid_type(self, expense_repository: ExpenseRepository):
        """Test filtering with invalid expense type."""
        expenses = await expense_repository.get_by_filters(expense_type="invalid_type")
        assert len(expenses) == 0

    def test_expense_model_repr(self, sample_expense_create: ExpenseCreate):
        """Test ExpenseModel string representation."""
        expense = ExpenseModel(
            id=1,
            date=sample_expense_create.date,
            amount=sample_expense_create.amount,
            category=sample_expense_create.category,
            description=sample_expense_create.description,
            merchant=sample_expense_create.merchant,
            type=ExpenseType.EXPENSE,
            source=ExpenseSource.MANUAL,
        )
        
        repr_str = repr(expense)
        
        assert "id=1" in repr_str
        assert f"amount={sample_expense_create.amount}" in repr_str
        assert f"category='{sample_expense_create.category}'" in repr_str