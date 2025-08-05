"""
Basic integration tests for expenses module.

Simple tests to verify core expenses functionality works correctly
without complex mocking or advanced scenarios.
"""

import pytest
from src.expenses.models import ExpenseType, ExpenseSource
from src.expenses.repository import ExpenseRepository
from src.expenses.schemas import ExpenseCreate, ExpenseUpdate
from src.expenses.service import ExpenseService


@pytest.mark.unit
@pytest.mark.expenses
class TestBasicExpenses:
    """Basic expenses functionality tests."""

    @pytest.mark.asyncio
    async def test_repository_basic_operations(self, db_session):
        """Test basic repository operations."""
        expense_repository = ExpenseRepository(db_session)
        
        # Create expense data
        expense_data = {
            "date": "2024-01-15",
            "amount": 25.50,
            "category": "GROCERIES",
            "description": "Weekly grocery shopping",
            "merchant": "SuperMarket XYZ",
            "type": ExpenseType.EXPENSE,
            "source": ExpenseSource.MANUAL,
            "original_currency": "EUR",
        }

        # Create expense
        created_expense = await expense_repository.create(expense_data)
        assert created_expense is not None
        assert created_expense.amount == 25.50
        assert created_expense.category == "GROCERIES"

        # Get expense by ID
        retrieved_expense = await expense_repository.get_by_id(created_expense.id)
        assert retrieved_expense is not None
        assert retrieved_expense.id == created_expense.id
        assert retrieved_expense.description == "Weekly grocery shopping"

        # Update expense
        update_data = ExpenseUpdate(amount=30.00, description="Updated shopping")
        updated_expense = await expense_repository.update(created_expense.id, update_data)
        assert updated_expense is not None
        assert updated_expense.amount == 30.00
        assert updated_expense.description == "Updated shopping"

    @pytest.mark.asyncio
    async def test_expense_filtering(self, db_session):
        """Test basic expense filtering operations."""
        expense_repository = ExpenseRepository(db_session)
        
        # Create test expenses
        expense_1 = {
            "date": "2024-01-15",
            "amount": 25.50,
            "category": "GROCERIES",
            "description": "Grocery shopping",
            "merchant": "SuperMarket",
            "type": ExpenseType.EXPENSE,
            "source": ExpenseSource.MANUAL,
        }
        
        expense_2 = {
            "date": "2024-01-20",
            "amount": 3000.00,
            "category": "SALARY",
            "description": "Monthly salary",
            "merchant": "Company Inc",
            "type": ExpenseType.INCOME,
            "source": ExpenseSource.MANUAL,
        }
        
        await expense_repository.create(expense_1)
        await expense_repository.create(expense_2)
        
        # Test filtering by type
        expenses = await expense_repository.get_by_type("expense")
        assert len(expenses) >= 1
        assert all(expense.type == ExpenseType.EXPENSE for expense in expenses)
        
        incomes = await expense_repository.get_by_type("income")
        assert len(incomes) >= 1
        assert all(expense.type == ExpenseType.INCOME for expense in incomes)
        
        # Test filtering by category
        grocery_expenses = await expense_repository.get_by_category("GROCERIES")
        assert len(grocery_expenses) >= 1
        assert all(expense.category == "GROCERIES" for expense in grocery_expenses)

    @pytest.mark.asyncio
    async def test_transaction_id_operations(self, db_session):
        """Test transaction ID related operations."""
        expense_repository = ExpenseRepository(db_session)
        
        # Create expense with transaction ID
        expense_data = {
            "date": "2024-01-15",
            "amount": 100.00,
            "category": "TRANSPORT",
            "description": "Gas payment",
            "merchant": "Gas Station",
            "type": ExpenseType.EXPENSE,
            "source": ExpenseSource.BELVO_INTEGRATION,
            "transaction_id": "TXN123456",
        }
        
        created_expense = await expense_repository.create(expense_data)
        assert created_expense.transaction_id == "TXN123456"
        
        # Test get by transaction ID
        retrieved_expense = await expense_repository.get_by_transaction_id("TXN123456")
        assert retrieved_expense is not None
        assert retrieved_expense.id == created_expense.id
        
        # Test transaction ID exists
        exists = await expense_repository.transaction_id_exists("TXN123456")
        assert exists is True
        
        non_exists = await expense_repository.transaction_id_exists("NONEXISTENT")
        assert non_exists is False
        
        # Test update by transaction ID
        update_data = ExpenseUpdate(amount=120.00, description="Updated gas payment")
        updated_expense = await expense_repository.update_by_transaction_id("TXN123456", update_data)
        assert updated_expense is not None
        assert updated_expense.amount == 120.00
        assert updated_expense.description == "Updated gas payment"

    @pytest.mark.asyncio
    async def test_date_filtering(self, db_session):
        """Test date-based filtering."""
        expense_repository = ExpenseRepository(db_session)
        
        # Create expenses in different months
        jan_expense = {
            "date": "2024-01-15",
            "amount": 50.00,
            "category": "FOOD",
            "description": "January expense",
            "merchant": "Restaurant",
            "type": ExpenseType.EXPENSE,
            "source": ExpenseSource.MANUAL,
        }
        
        feb_expense = {
            "date": "2024-02-15",
            "amount": 75.00,
            "category": "FOOD",
            "description": "February expense",
            "merchant": "Restaurant",
            "type": ExpenseType.EXPENSE,
            "source": ExpenseSource.MANUAL,
        }
        
        await expense_repository.create(jan_expense)
        await expense_repository.create(feb_expense)
        
        # Test filtering by year
        expenses_2024 = await expense_repository.get_by_date_filter(year=2024)
        assert len(expenses_2024) >= 2
        assert all("2024" in expense.date for expense in expenses_2024)
        
        # Test filtering by month and year
        jan_expenses = await expense_repository.get_by_date_filter(month=1, year=2024)
        assert len(jan_expenses) >= 1
        assert all("2024-01" in expense.date for expense in jan_expenses)
        
        feb_expenses = await expense_repository.get_by_date_filter(month=2, year=2024)
        assert len(feb_expenses) >= 1
        assert all("2024-02" in expense.date for expense in feb_expenses)

    @pytest.mark.asyncio
    async def test_comprehensive_filtering(self, db_session):
        """Test comprehensive filtering with multiple criteria."""
        expense_repository = ExpenseRepository(db_session)
        
        # Create test expense
        expense_data = {
            "date": "2024-03-15",
            "amount": 85.00,
            "category": "ENTERTAINMENT",
            "description": "Movie tickets and popcorn",
            "merchant": "Cinema Complex",
            "type": ExpenseType.EXPENSE,
            "source": ExpenseSource.MANUAL,
        }
        
        await expense_repository.create(expense_data)
        
        # Test comprehensive filtering
        filtered_expenses = await expense_repository.get_by_filters(
            year=2024,
            month=3,
            expense_type="expense",
            category="ENTERTAINMENT",
            search="movie"
        )
        
        assert len(filtered_expenses) >= 1
        expense = filtered_expenses[0]
        assert "2024-03" in expense.date
        assert expense.type == ExpenseType.EXPENSE
        assert expense.category == "ENTERTAINMENT"
        assert "movie" in expense.description.lower()

    def test_expense_enums(self):
        """Test expense enums values."""
        # Test ExpenseType enum
        assert ExpenseType.EXPENSE.value == "expense"
        assert ExpenseType.INCOME.value == "income"
        
        # Test ExpenseSource enum
        assert ExpenseSource.AI_PROCESSED.value == "ai-processed"
        assert ExpenseSource.MANUAL.value == "manual"
        assert ExpenseSource.BELVO_INTEGRATION.value == "belvo-integration"

    def test_expense_schemas_validation(self):
        """Test expense schema validation."""
        # Test valid expense creation
        valid_expense = ExpenseCreate(
            date="2024-01-15",
            amount=25.50,
            category="GROCERIES",
            description="Weekly shopping",
            merchant="SuperMarket",
            type="expense",
        )
        
        assert valid_expense.date == "2024-01-15"
        assert valid_expense.amount == 25.50
        assert valid_expense.type == "expense"
        
        # Test expense update schema
        update_data = ExpenseUpdate(
            amount=30.00,
            description="Updated description",
        )
        
        assert update_data.amount == 30.00
        assert update_data.description == "Updated description"
        assert update_data.category is None  # Optional field