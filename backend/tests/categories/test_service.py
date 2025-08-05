"""
Comprehensive unit tests for categories service layer.

Tests the business logic layer for categories with mocked dependencies,
focusing on service methods, validation, and error handling.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.service import CategoryService
from src.categories.repository import CategoryRepository
from src.categories.models import CategoryModel, CategoryType
from src.categories.schemas import CategoryCreate, CategoryUpdate, CategoryStats
from src.categories.translation_service import CategoryTranslationService


@pytest.mark.unit
@pytest.mark.categories 
@pytest.mark.service
class TestCategoryService:
    """Test category service business logic."""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock AsyncSession for testing."""
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def mock_repository(self):
        """Create a mock CategoryRepository for testing."""
        return AsyncMock(spec=CategoryRepository)

    @pytest.fixture
    def mock_translation_service(self):
        """Create a mock CategoryTranslationService for testing."""
        return AsyncMock(spec=CategoryTranslationService)

    @pytest.fixture
    def category_service(self, mock_db_session):
        """Create a CategoryService instance with mocked dependencies."""
        with patch('src.categories.service.CategoryRepository') as mock_repo_class, \
             patch('src.categories.service.CategoryTranslationService') as mock_trans_class:
            
            service = CategoryService(mock_db_session)
            service.repository = AsyncMock(spec=CategoryRepository)
            service.translation_service = AsyncMock(spec=CategoryTranslationService)
            return service

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
            name="transport",  # lowercase to test normalization
            description="Transportation expenses",
            color="#FF9800",
            icon="car",
            category_type=CategoryType.EXPENSE.value,
        )

    @pytest.mark.asyncio
    async def test_get_user_categories_with_defaults(
        self, category_service, sample_category_model
    ):
        """Test retrieving user categories including defaults."""
        # Setup
        categories = [sample_category_model]
        category_service.repository.get_user_categories.return_value = categories
        
        # Execute
        result = await category_service.get_user_categories(user_id=123, include_default=True)
        
        # Verify
        assert result == categories
        category_service.repository.get_user_categories.assert_called_once_with(123, True)

    @pytest.mark.asyncio
    async def test_get_user_categories_custom_only(
        self, category_service, sample_category_model
    ):
        """Test retrieving only user custom categories."""
        # Setup
        categories = [sample_category_model]
        category_service.repository.get_user_categories.return_value = categories
        
        # Execute
        result = await category_service.get_user_categories(user_id=123, include_default=False)
        
        # Verify
        assert result == categories
        category_service.repository.get_user_categories.assert_called_once_with(123, False)

    @pytest.mark.asyncio
    async def test_create_user_category_success(
        self, category_service, sample_category_create, sample_category_model
    ):
        """Test successful user category creation with name normalization."""
        # Setup
        category_service.repository.category_exists.return_value = False
        category_service.repository.create_user_category.return_value = sample_category_model
        category_service.translation_service.translate_category_content.return_value = {
            "name": {"en": "Transport"}
        }
        
        # Execute
        result = await category_service.create_user_category(user_id=123, category_data=sample_category_create)
        
        # Verify
        assert result == sample_category_model
        
        # Verify name was normalized to title case
        assert sample_category_create.name == "Transport"
        
        # Verify the flow
        category_service.repository.category_exists.assert_called_once_with("Transport", 123)
        category_service.translation_service.translate_category_content.assert_called_once()
        category_service.repository.create_user_category.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_user_category_duplicate_name(
        self, category_service, sample_category_create
    ):
        """Test creating category with duplicate name."""
        # Setup
        category_service.repository.category_exists.return_value = True
        
        # Execute & Verify
        with pytest.raises(ValueError, match="Category 'Transport' already exists"):
            await category_service.create_user_category(user_id=123, category_data=sample_category_create)
        
        category_service.repository.create_user_category.assert_not_called()

    @pytest.mark.asyncio
    async def test_create_user_category_translation_failure(
        self, category_service, sample_category_create, sample_category_model
    ):
        """Test category creation when translation service fails."""
        # Setup
        category_service.repository.category_exists.return_value = False
        category_service.repository.create_user_category.return_value = sample_category_model
        category_service.translation_service.translate_category_content.side_effect = Exception("Translation failed")
        
        # Execute
        result = await category_service.create_user_category(user_id=123, category_data=sample_category_create)
        
        # Verify
        assert result == sample_category_model
        
        # Verify category was still created with None translations
        category_service.repository.create_user_category.assert_called_once()
        call_args = category_service.repository.create_user_category.call_args
        # Arguments are (user_id, category_data, translations)
        assert call_args[0][2] is None  # translations is the third positional argument

    @pytest.mark.asyncio
    async def test_update_category_success(
        self, category_service, sample_category_model
    ):
        """Test successful category update."""
        # Setup
        user_category = CategoryModel(
            id=1, name="CUSTOM_CAT", user_id=123, is_default=False, is_active=True
        )
        update_data = CategoryUpdate(description="Updated description")
        updated_category = CategoryModel(
            id=1, name="CUSTOM_CAT", user_id=123, is_default=False, is_active=True, 
            description="Updated description"
        )
        
        category_service.repository.get_by_id.return_value = user_category
        category_service.repository.update.return_value = updated_category
        
        # Execute
        result = await category_service.update_category(1, user_id=123, update_data=update_data)
        
        # Verify
        assert result == updated_category
        category_service.repository.get_by_id.assert_called_once_with(1)
        category_service.repository.update.assert_called_once_with(1, update_data)

    @pytest.mark.asyncio
    async def test_update_category_name_normalization(self, category_service):
        """Test that category name updates are normalized to title case."""
        # Setup
        user_category = CategoryModel(
            id=1, name="CUSTOM_CAT", user_id=123, is_default=False, is_active=True
        )
        update_data = CategoryUpdate(name="updated name")  # lowercase
        
        category_service.repository.get_by_id.return_value = user_category
        category_service.repository.category_exists.return_value = False
        category_service.repository.update.return_value = user_category
        
        # Execute
        await category_service.update_category(1, user_id=123, update_data=update_data)
        
        # Verify the name was normalized to title case
        assert update_data.name == "Updated Name"

    @pytest.mark.asyncio
    async def test_update_category_not_found(self, category_service):
        """Test updating non-existent category."""
        # Setup
        update_data = CategoryUpdate(description="Updated description")
        category_service.repository.get_by_id.return_value = None
        
        # Execute
        result = await category_service.update_category(999, user_id=123, update_data=update_data)
        
        # Verify
        assert result is None
        category_service.repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_category_default_forbidden(self, category_service, sample_category_model):
        """Test that default categories cannot be updated."""
        # Setup - sample_category_model is a default category
        update_data = CategoryUpdate(description="Updated description")
        category_service.repository.get_by_id.return_value = sample_category_model
        
        # Execute
        result = await category_service.update_category(1, user_id=123, update_data=update_data)
        
        # Verify
        assert result is None
        category_service.repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_category_wrong_user(self, category_service):
        """Test that users can only update their own categories."""
        # Setup - category belongs to different user
        other_user_category = CategoryModel(
            id=1, name="OTHER_CAT", user_id=456, is_default=False, is_active=True
        )
        update_data = CategoryUpdate(description="Updated description")
        category_service.repository.get_by_id.return_value = other_user_category
        
        # Execute
        result = await category_service.update_category(1, user_id=123, update_data=update_data)
        
        # Verify
        assert result is None
        category_service.repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_category_duplicate_name(self, category_service):
        """Test updating category with duplicate name."""
        # Setup
        user_category = CategoryModel(
            id=1, name="CUSTOM_CAT", user_id=123, is_default=False, is_active=True
        )
        update_data = CategoryUpdate(name="existing name")
        
        category_service.repository.get_by_id.return_value = user_category
        category_service.repository.category_exists.return_value = True
        
        # Execute & Verify
        with pytest.raises(ValueError, match="Category 'Existing Name' already exists"):
            await category_service.update_category(1, user_id=123, update_data=update_data)
        
        category_service.repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete_category_success(self, category_service):
        """Test successful category deletion."""
        # Setup
        category_service.repository.deactivate_category.return_value = True
        
        # Execute
        result = await category_service.delete_category(1, user_id=123)
        
        # Verify
        assert result is True
        category_service.repository.deactivate_category.assert_called_once_with(1, 123)

    @pytest.mark.asyncio
    async def test_delete_category_not_found(self, category_service):
        """Test deleting non-existent category."""
        # Setup
        category_service.repository.deactivate_category.return_value = False
        
        # Execute
        result = await category_service.delete_category(999, user_id=123)
        
        # Verify
        assert result is False
        category_service.repository.deactivate_category.assert_called_once_with(999, 123)

    @pytest.mark.asyncio
    async def test_get_category_stats(self, category_service):
        """Test retrieving category usage statistics."""
        # Setup
        stats_data = [
            {"category_id": 1, "category_name": "GROCERIES", "expense_count": 10, "total_amount": 500.0},
            {"category_id": 2, "category_name": "TRANSPORT", "expense_count": 5, "total_amount": 200.0},
        ]
        category_service.repository.get_category_stats.return_value = stats_data
        
        # Execute
        result = await category_service.get_category_stats(user_id=123)
        
        # Verify
        assert len(result) == 2
        assert isinstance(result[0], CategoryStats)
        assert result[0].category_id == 1
        assert result[0].category_name == "GROCERIES"
        assert result[0].expense_count == 10
        assert result[0].total_amount == 500.0
        category_service.repository.get_category_stats.assert_called_once_with(123)

    @pytest.mark.asyncio
    async def test_seed_default_categories(self, category_service):
        """Test seeding database with default categories."""
        # Setup
        category_service.repository.get_by_name.side_effect = [None, None, CategoryModel(id=3, name="EXISTING")]
        category_service.repository.create_default_category.return_value = CategoryModel(id=1, name="NEW")
        
        # Mock DEFAULT_CATEGORIES
        with patch('src.categories.service.DEFAULT_CATEGORIES', [
            {"name": "NEW_CAT_1"},
            {"name": "NEW_CAT_2"},
            {"name": "EXISTING"}
        ]):
            # Execute
            result = await category_service.seed_default_categories()
        
        # Verify
        assert result == 2  # Only 2 new categories created
        assert category_service.repository.create_default_category.call_count == 2

    @pytest.mark.asyncio
    async def test_update_default_category_translations(self, category_service):
        """Test updating existing default categories with translations."""
        # Setup
        default_categories = [
            CategoryModel(id=1, name="GROCERIES", translations=None),
            CategoryModel(id=2, name="TRANSPORT", translations=None),
        ]
        
        category_service.repository.get_default_categories.return_value = default_categories
        category_service.translation_service.populate_default_category_translations.return_value = {
            "GROCERIES": {"name": {"en": "Groceries"}},
            "TRANSPORT": {"name": {"en": "Transport"}},
        }
        category_service.db.commit = AsyncMock()
        
        # Execute
        result = await category_service.update_default_category_translations()
        
        # Verify
        assert result == 2
        assert category_service.db.commit.call_count == 2
        assert default_categories[0].translations == {"name": {"en": "Groceries"}}
        assert default_categories[1].translations == {"name": {"en": "Transport"}}

    @pytest.mark.asyncio
    async def test_get_category_names_for_llm_with_user(self, category_service):
        """Test getting category names for LLM processing with user ID."""
        # Setup
        category_service.repository.get_active_category_names.return_value = ["GROCERIES", "TRANSPORT"]
        
        # Execute
        result = await category_service.get_category_names_for_llm(user_id=123)
        
        # Verify
        assert result == ["GROCERIES", "TRANSPORT"]
        category_service.repository.get_active_category_names.assert_called_once_with(123)

    @pytest.mark.asyncio
    async def test_get_category_names_for_llm_defaults_only(self, category_service):
        """Test getting category names for LLM processing without user ID."""
        # Setup
        default_categories = [
            CategoryModel(name="GROCERIES"),
            CategoryModel(name="TRANSPORT"),
        ]
        category_service.repository.get_default_categories.return_value = default_categories
        
        # Execute
        result = await category_service.get_category_names_for_llm(user_id=None)
        
        # Verify
        assert result == ["GROCERIES", "TRANSPORT"]
        category_service.repository.get_default_categories.assert_called_once()

    @pytest.mark.asyncio
    async def test_service_initialization(self, mock_db_session):
        """Test that CategoryService initializes correctly."""
        # Execute
        service = CategoryService(mock_db_session)
        
        # Verify
        assert service.db == mock_db_session
        assert isinstance(service.repository, CategoryRepository)
        assert isinstance(service.translation_service, CategoryTranslationService)

    @pytest.mark.asyncio
    async def test_category_name_normalization_edge_cases(self, category_service):
        """Test category name normalization with various edge cases."""
        test_cases = [
            ("groceries", "Groceries"),
            ("TRANSPORT", "Transport"),
            ("health & wellness", "Health & Wellness"),
            ("  utilities  ", "  Utilities  "),  # title() doesn't strip whitespace
            ("food_dining", "Food_Dining"),
            ("123numbers", "123Numbers"),
        ]
        
        user_category = CategoryModel(
            id=1, name="CUSTOM_CAT", user_id=123, is_default=False, is_active=True
        )
        category_service.repository.get_by_id.return_value = user_category
        category_service.repository.category_exists.return_value = False
        category_service.repository.update.return_value = user_category
        
        for input_name, expected_name in test_cases:
            update_data = CategoryUpdate(name=input_name)
            
            await category_service.update_category(1, user_id=123, update_data=update_data)
            
            assert update_data.name == expected_name

    @pytest.mark.asyncio
    async def test_error_handling_in_create_category(self, category_service, sample_category_create):
        """Test error handling during category creation."""
        # Setup
        category_service.repository.category_exists.return_value = False
        category_service.repository.create_user_category.side_effect = Exception("Database error")
        
        # Execute & Verify
        with pytest.raises(Exception, match="Database error"):
            await category_service.create_user_category(user_id=123, category_data=sample_category_create)

    @pytest.mark.asyncio
    async def test_get_category_stats_empty_result(self, category_service):
        """Test getting category stats when no data exists."""
        # Setup
        category_service.repository.get_category_stats.return_value = []
        
        # Execute
        result = await category_service.get_category_stats(user_id=123)
        
        # Verify
        assert result == []
        category_service.repository.get_category_stats.assert_called_once_with(123)