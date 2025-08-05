"""
Basic integration tests for categories module.

Simple tests to verify core categories functionality works correctly
without complex mocking or advanced scenarios.
"""

import pytest
from datetime import datetime

from src.categories.models import CategoryModel, CategoryType
from src.categories.schemas import CategoryCreate, CategoryUpdate


@pytest.mark.unit
@pytest.mark.categories
class TestBasicCategories:
    """Basic categories functionality tests."""

    @pytest.mark.asyncio
    async def test_category_model_creation(self, db_session):
        """Test creating category models directly."""
        # Test expense category
        expense_category = CategoryModel(
            name="GROCERIES",
            description="Food and grocery expenses",
            color="#4CAF50",
            icon="shopping-cart",
            is_default=True,
            is_active=True,
            category_type=CategoryType.EXPENSE,
            user_id=None,  # Default category
            translations={
                "name": {
                    "en": "Groceries",
                    "es": "Comestibles",
                    "pt": "Mantimentos"
                },
                "description": {
                    "en": "Food and grocery expenses",
                    "es": "Gastos de alimentación y compras",
                    "pt": "Despesas com alimentação e compras"
                }
            }
        )
        
        db_session.add(expense_category)
        await db_session.commit()
        await db_session.refresh(expense_category)
        
        assert expense_category.id is not None
        assert expense_category.name == "GROCERIES"
        assert expense_category.category_type == CategoryType.EXPENSE
        assert expense_category.is_default is True
        assert expense_category.is_active is True
        assert expense_category.color == "#4CAF50"
        assert expense_category.icon == "shopping-cart"
        assert expense_category.user_id is None
        assert expense_category.translations is not None
        assert expense_category.created_at is not None

    @pytest.mark.asyncio
    async def test_income_category_creation(self, db_session):
        """Test creating an income category."""
        income_category = CategoryModel(
            name="SALARY",
            description="Monthly salary income",
            color="#2196F3",
            icon="money",
            is_default=True,
            is_active=True,
            category_type=CategoryType.INCOME,
            user_id=None,
            translations={
                "name": {
                    "en": "Salary",
                    "es": "Salario",
                    "pt": "Salário"
                }
            }
        )
        
        db_session.add(income_category)
        await db_session.commit()
        await db_session.refresh(income_category)
        
        assert income_category.id is not None
        assert income_category.name == "SALARY"
        assert income_category.category_type == CategoryType.INCOME
        assert income_category.is_default is True

    @pytest.mark.asyncio
    async def test_user_custom_category(self, db_session):
        """Test creating a user-specific custom category."""
        user_category = CategoryModel(
            name="MY_CUSTOM_CATEGORY",
            description="User's custom category",
            color="#FF5722",
            icon="custom-icon",
            is_default=False,
            is_active=True,
            category_type=CategoryType.EXPENSE,
            user_id=123,  # User-specific category
        )
        
        db_session.add(user_category)
        await db_session.commit()
        await db_session.refresh(user_category)
        
        assert user_category.id is not None
        assert user_category.name == "MY_CUSTOM_CATEGORY"
        assert user_category.is_default is False
        assert user_category.user_id == 123

    @pytest.mark.asyncio
    async def test_category_unique_constraint(self, db_session):
        """Test that category names must be unique."""
        # Create first category
        category1 = CategoryModel(
            name="UNIQUE_CATEGORY",
            category_type=CategoryType.EXPENSE,
        )
        
        db_session.add(category1)
        await db_session.commit()
        
        # Try to create another category with the same name
        category2 = CategoryModel(
            name="UNIQUE_CATEGORY",  # Same name
            category_type=CategoryType.INCOME,  # Different type
        )
        
        db_session.add(category2)
        
        # This should raise an integrity error due to unique constraint
        with pytest.raises(Exception):  # Could be IntegrityError or similar
            await db_session.commit()

    def test_category_schema_validation(self):
        """Test category schema validation."""
        # Test valid category creation
        valid_category = CategoryCreate(
            name="TRANSPORT",
            description="Transportation expenses",
            color="#FF9800",
            icon="car",
            category_type=CategoryType.EXPENSE.value,
        )
        
        assert valid_category.name == "TRANSPORT"
        assert valid_category.category_type == CategoryType.EXPENSE.value
        assert valid_category.color == "#FF9800"
        assert valid_category.icon == "car"

    def test_category_update_schema(self):
        """Test category update schema."""
        update_data = CategoryUpdate(
            description="Updated description",
            color="#9C27B0",
            icon="updated-icon",
            is_active=False,
        )
        
        assert update_data.description == "Updated description"
        assert update_data.color == "#9C27B0"
        assert update_data.icon == "updated-icon"
        assert update_data.is_active is False

    def test_category_enums_values(self):
        """Test category enum values."""
        # Test CategoryType enum
        assert CategoryType.EXPENSE.value == "EXPENSE"
        assert CategoryType.INCOME.value == "INCOME"

    def test_category_model_repr(self):
        """Test CategoryModel string representation."""
        category = CategoryModel(
            id=1,
            name="TEST_CATEGORY",
            is_default=True,
        )
        
        repr_str = repr(category)
        
        assert "id=1" in repr_str
        assert "name='TEST_CATEGORY'" in repr_str
        assert "is_default=True" in repr_str

    @pytest.mark.asyncio
    async def test_category_deactivation(self, db_session):
        """Test deactivating a category."""
        category = CategoryModel(
            name="DEACTIVATE_TEST",
            category_type=CategoryType.EXPENSE,
            is_active=True,
        )
        
        db_session.add(category)
        await db_session.commit()
        await db_session.refresh(category)
        
        # Deactivate the category
        category.is_active = False
        await db_session.commit()
        
        assert category.is_active is False

    @pytest.mark.asyncio
    async def test_category_with_translations(self, db_session):
        """Test category with multilingual translations."""
        category = CategoryModel(
            name="MULTILINGUAL_TEST",
            category_type=CategoryType.EXPENSE,
            translations={
                "name": {
                    "en": "Food",
                    "es": "Comida",
                    "pt": "Comida",
                    "fr": "Nourriture"
                },
                "description": {
                    "en": "Food and dining expenses",
                    "es": "Gastos de comida y restaurantes",
                    "pt": "Despesas com comida e restaurantes"
                }
            }
        )
        
        db_session.add(category)
        await db_session.commit()
        await db_session.refresh(category)
        
        assert category.translations is not None
        assert "name" in category.translations
        assert "description" in category.translations
        assert category.translations["name"]["en"] == "Food"
        assert category.translations["name"]["es"] == "Comida"
        assert category.translations["name"]["pt"] == "Comida"
        assert category.translations["name"]["fr"] == "Nourriture"

    @pytest.mark.asyncio
    async def test_default_vs_custom_categories(self, db_session):
        """Test distinction between default and custom categories."""
        # Create default category
        default_category = CategoryModel(
            name="DEFAULT_CATEGORY",
            category_type=CategoryType.EXPENSE,
            is_default=True,
            user_id=None,
        )
        
        # Create custom category
        custom_category = CategoryModel(
            name="CUSTOM_CATEGORY",
            category_type=CategoryType.EXPENSE,
            is_default=False,
            user_id=456,
        )
        
        db_session.add(default_category)
        db_session.add(custom_category)
        await db_session.commit()
        
        await db_session.refresh(default_category)
        await db_session.refresh(custom_category)
        
        # Verify properties
        assert default_category.is_default is True
        assert default_category.user_id is None
        
        assert custom_category.is_default is False
        assert custom_category.user_id == 456

    @pytest.mark.asyncio
    async def test_category_timestamps(self, db_session):
        """Test category timestamp handling."""
        category = CategoryModel(
            name="TIMESTAMP_TEST",
            category_type=CategoryType.EXPENSE,
        )
        
        db_session.add(category)
        await db_session.commit()
        await db_session.refresh(category)
        
        initial_created_at = category.created_at
        initial_updated_at = category.updated_at
        
        assert initial_created_at is not None
        assert initial_updated_at is not None
        assert isinstance(initial_created_at, datetime)
        assert isinstance(initial_updated_at, datetime)
        
        # Update the category
        category.description = "Updated description"
        await db_session.commit()
        await db_session.refresh(category)
        
        # created_at should remain the same, updated_at should change
        assert category.created_at == initial_created_at
        assert category.updated_at >= initial_updated_at

    def test_category_color_validation(self):
        """Test category color hex code validation."""
        # Test valid hex colors
        valid_colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "#000000"]
        
        for color in valid_colors:
            category = CategoryCreate(
                name=f"COLOR_TEST_{color.replace('#', '')}",
                category_type=CategoryType.EXPENSE,
                color=color,
            )
            assert category.color == color

    @pytest.mark.asyncio
    async def test_expense_and_income_categories_coexist(self, db_session):
        """Test that expense and income categories can coexist."""
        # Create expense category
        expense_cat = CategoryModel(
            name="BUSINESS_EXPENSE",
            category_type=CategoryType.EXPENSE,
            description="Business related expenses",
        )
        
        # Create income category with similar name
        income_cat = CategoryModel(
            name="BUSINESS_INCOME", 
            category_type=CategoryType.INCOME,
            description="Business related income",
        )
        
        db_session.add(expense_cat)
        db_session.add(income_cat)
        await db_session.commit()
        
        await db_session.refresh(expense_cat)
        await db_session.refresh(income_cat)
        
        assert expense_cat.category_type == CategoryType.EXPENSE
        assert income_cat.category_type == CategoryType.INCOME
        assert expense_cat.id != income_cat.id