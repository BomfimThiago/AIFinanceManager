"""
Comprehensive unit tests for categories repository layer.

Tests the data access layer for categories without complex business logic,
focusing on CRUD operations, filtering, and database interactions.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from src.categories.repository import CategoryRepository
from src.categories.models import CategoryModel, CategoryType
from src.categories.schemas import CategoryCreate, CategoryUpdate


@pytest.mark.unit
@pytest.mark.categories
@pytest.mark.repository
class TestCategoryRepository:
    """Test category repository operations."""

    @pytest.fixture
    def mock_session(self):
        """Create a mock AsyncSession for testing."""
        session = AsyncMock(spec=AsyncSession)
        return session

    @pytest.fixture
    def category_repository(self, mock_session):
        """Create a CategoryRepository instance with mocked session."""
        return CategoryRepository(mock_session)

    @pytest.fixture
    def sample_category_model(self):
        """Create a sample CategoryModel for testing."""
        return CategoryModel(
            id=1,
            name="GROCERIES",
            description="Food and grocery expenses",
            color="#4CAF50",
            icon="shopping-cart",
            is_default=True,
            is_active=True,
            category_type=CategoryType.EXPENSE,
            user_id=None,
            translations={
                "name": {
                    "en": "Groceries",
                    "es": "Comestibles",
                    "pt": "Mantimentos"
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    @pytest.fixture
    def sample_category_create(self):
        """Create a sample CategoryCreate schema for testing."""
        return CategoryCreate(
            name="TRANSPORT",
            description="Transportation expenses",
            color="#FF9800",
            icon="car",
            category_type=CategoryType.EXPENSE.value,
        )

    @pytest.mark.asyncio
    async def test_get_by_name_found(
        self, category_repository, mock_session, sample_category_model
    ):
        """Test retrieving category by name when found."""
        # Setup
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_category_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_by_name("GROCERIES")
        
        # Verify
        assert result == sample_category_model
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_by_name_not_found(self, category_repository, mock_session):
        """Test retrieving category by name when not found."""
        # Setup
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_by_name("NONEXISTENT")
        
        # Verify
        assert result is None
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_categories_with_defaults(self, category_repository, mock_session):
        """Test retrieving user categories including defaults."""
        # Setup
        categories = [
            CategoryModel(id=1, name="GROCERIES", user_id=None, is_default=True),
            CategoryModel(id=2, name="CUSTOM_CAT", user_id=123, is_default=False),
        ]
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = categories
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_user_categories(user_id=123, include_default=True)
        
        # Verify
        assert result == categories
        assert len(result) == 2
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_categories_custom_only(self, category_repository, mock_session):
        """Test retrieving only user custom categories."""
        # Setup
        user_categories = [
            CategoryModel(id=2, name="CUSTOM_CAT", user_id=123, is_default=False),
        ]
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = user_categories
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_user_categories(user_id=123, include_default=False)
        
        # Verify
        assert result == user_categories
        assert len(result) == 1
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_default_categories(self, category_repository, mock_session):
        """Test retrieving default categories."""
        # Setup
        default_categories = [
            CategoryModel(id=1, name="GROCERIES", is_default=True, user_id=None),
            CategoryModel(id=2, name="TRANSPORT", is_default=True, user_id=None),
        ]
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = default_categories
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_default_categories()
        
        # Verify
        assert result == default_categories
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_category_success(
        self, category_repository, mock_session, sample_category_create
    ):
        """Test successful user category creation."""
        # Setup
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()
        
        # Execute
        result = await category_repository.create_user_category(
            user_id=123, 
            category_data=sample_category_create,
            translations={"name": {"en": "Transport"}}
        )
        
        # Verify
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()
        
        # Verify the created category properties
        created_category = mock_session.add.call_args[0][0]
        assert created_category.name == sample_category_create.name
        assert created_category.user_id == 123
        assert created_category.is_default is False
        assert created_category.is_active is True
        assert created_category.translations == {"name": {"en": "Transport"}}

    @pytest.mark.asyncio
    async def test_create_default_category_success(
        self, category_repository, mock_session
    ):
        """Test successful default category creation."""
        # Setup
        category_data = {
            "name": "UTILITIES",
            "category_type": CategoryType.EXPENSE.value,
            "description": "Utility bills",
            "color": "#FF5722",
            "icon": "home",
            "translations": {"name": {"en": "Utilities"}}
        }
        
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()
        
        # Execute
        result = await category_repository.create_default_category(category_data)
        
        # Verify
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()
        
        # Verify the created category properties
        created_category = mock_session.add.call_args[0][0]
        assert created_category.name == "UTILITIES"
        assert created_category.user_id is None
        assert created_category.is_default is True
        assert created_category.is_active is True

    @pytest.mark.asyncio
    async def test_category_exists_true(self, category_repository, mock_session):
        """Test checking category existence when it exists."""
        # Setup
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = CategoryModel(id=1, name="GROCERIES")
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.category_exists("GROCERIES", user_id=123)
        
        # Verify
        assert result is True
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_category_exists_false(self, category_repository, mock_session):
        """Test checking category existence when it doesn't exist."""
        # Setup
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.category_exists("NONEXISTENT", user_id=123)
        
        # Verify
        assert result is False
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_category_stats(self, category_repository, mock_session):
        """Test retrieving category usage statistics."""
        # Setup - properly mock database row attributes
        mock_row1 = MagicMock()
        mock_row1.id = 1
        mock_row1.name = "GROCERIES"
        mock_row1.expense_count = 10
        mock_row1.total_amount = 500.0
        
        mock_row2 = MagicMock()
        mock_row2.id = 2
        mock_row2.name = "TRANSPORT"
        mock_row2.expense_count = 5
        mock_row2.total_amount = 200.0
        
        mock_rows = [mock_row1, mock_row2]
        
        mock_result = MagicMock()
        mock_result.all.return_value = mock_rows
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_category_stats(user_id=123)
        
        # Verify
        assert len(result) == 2
        assert result[0]["category_id"] == 1
        assert result[0]["category_name"] == "GROCERIES"
        assert result[0]["expense_count"] == 10
        assert result[0]["total_amount"] == 500.0
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_deactivate_category_success(
        self, category_repository, mock_session, sample_category_model
    ):
        """Test successful category deactivation."""
        # Setup - create a user category (not default)
        user_category = CategoryModel(
            id=1, name="CUSTOM_CAT", user_id=123, is_default=False, is_active=True
        )
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = user_category
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.commit = AsyncMock()
        
        # Execute
        result = await category_repository.deactivate_category(1, user_id=123)
        
        # Verify
        assert result is True
        assert user_category.is_active is False
        mock_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_deactivate_category_default_fails(
        self, category_repository, mock_session, sample_category_model
    ):
        """Test that default categories cannot be deactivated."""
        # Setup - sample_category_model is a default category
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_category_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.deactivate_category(1, user_id=123)
        
        # Verify
        assert result is False
        mock_session.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_deactivate_category_not_found(self, category_repository, mock_session):
        """Test deactivating non-existent category."""
        # Setup
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.deactivate_category(999, user_id=123)
        
        # Verify
        assert result is False
        mock_session.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_active_category_names(self, category_repository, mock_session):
        """Test retrieving active category names for a user."""
        # Setup
        categories = [
            CategoryModel(id=1, name="GROCERIES"),
            CategoryModel(id=2, name="TRANSPORT"),
        ]
        
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = categories
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        # Execute
        result = await category_repository.get_active_category_names(user_id=123)
        
        # Verify
        assert result == ["GROCERIES", "TRANSPORT"]
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_category_with_integrity_error(
        self, category_repository, mock_session, sample_category_create
    ):
        """Test user category creation with integrity constraint violation."""
        # Setup
        mock_session.add = MagicMock()
        mock_session.commit = AsyncMock(side_effect=IntegrityError("", "", ""))
        mock_session.rollback = AsyncMock()
        
        # Execute & Verify
        with pytest.raises(IntegrityError):
            await category_repository.create_user_category(
                user_id=123, 
                category_data=sample_category_create
            )

    @pytest.mark.asyncio
    async def test_inherited_base_repository_methods(
        self, category_repository, mock_session, sample_category_model
    ):
        """Test that inherited BaseRepository methods work correctly."""
        # Test get_by_id from BaseRepository
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_category_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        
        result = await category_repository.get_by_id(1)
        
        assert result == sample_category_model
        mock_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_category_via_base_repository(
        self, category_repository, mock_session, sample_category_model
    ):
        """Test updating category via inherited BaseRepository method."""
        # Setup
        update_data = CategoryUpdate(description="Updated description")
        
        # Mock get_by_id call
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_category_model
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.commit = AsyncMock()
        mock_session.refresh = AsyncMock()
        
        # Execute
        result = await category_repository.update(1, update_data)
        
        # Verify
        assert result == sample_category_model
        assert sample_category_model.description == "Updated description"
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_category_via_base_repository(
        self, category_repository, mock_session
    ):
        """Test deleting category via inherited BaseRepository method."""
        # Setup
        mock_result = MagicMock()
        mock_result.rowcount = 1
        mock_session.execute = AsyncMock(return_value=mock_result)
        mock_session.commit = AsyncMock()
        
        # Execute
        result = await category_repository.delete(1)
        
        # Verify
        assert result is True
        mock_session.execute.assert_called_once()
        mock_session.commit.assert_called_once()