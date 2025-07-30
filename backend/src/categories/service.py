"""
Category service for business logic.

This module contains the service class for category-related business operations,
including LLM integration and file management.
"""

from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.constants import (
    CATEGORIES_FILE_PATH,
    DEFAULT_CATEGORIES,
)
from src.categories.models import CategoryModel
from src.categories.repository import CategoryRepository
from src.categories.schemas import CategoryCreate, CategoryStats, CategoryUpdate


class CategoryService:
    """Service for category management and LLM integration."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CategoryRepository(db)

    async def get_user_categories(
        self, user_id: int, include_default: bool = True
    ) -> list[CategoryModel]:
        """Get categories available to a user."""
        return await self.repository.get_user_categories(user_id, include_default)

    async def create_user_category(
        self, user_id: int, category_data: CategoryCreate
    ) -> CategoryModel:
        """Create a new custom category for a user."""
        # Capitalize the category name
        category_data.name = category_data.name.title()

        # Check if category already exists
        if await self.repository.category_exists(category_data.name, user_id):
            raise ValueError(f"Category '{category_data.name}' already exists")

        # Create the category
        category = await self.repository.create_user_category(user_id, category_data)

        # Update categories file for LLM
        await self._update_categories_file()

        return category

    async def update_category(
        self, category_id: int, user_id: int, update_data: CategoryUpdate
    ) -> CategoryModel | None:
        """Update a user's custom category."""
        category = await self.repository.get_by_id(category_id)

        # Verify ownership and that it's not a default category
        if not category or category.is_default or category.user_id != user_id:
            return None

        # Capitalize the category name if being updated
        if update_data.name:
            update_data.name = update_data.name.title()

        # Check for name conflicts if name is being updated
        if (
            update_data.name
            and update_data.name != category.name
            and await self.repository.category_exists(update_data.name, user_id)
        ):
            raise ValueError(f"Category '{update_data.name}' already exists")

        # Update the category
        updated_category = await self.repository.update(category_id, update_data)

        # Update categories file for LLM
        await self._update_categories_file()

        return updated_category

    async def delete_category(self, category_id: int, user_id: int) -> bool:
        """Delete (deactivate) a user's custom category."""
        success = await self.repository.deactivate_category(category_id, user_id)

        if success:
            # Update categories file for LLM
            await self._update_categories_file()

        return success

    async def get_category_stats(self, user_id: int) -> list[CategoryStats]:
        """Get category usage statistics for a user."""
        stats_data = await self.repository.get_category_stats(user_id)

        return [
            CategoryStats(
                category_id=stat["category_id"],
                category_name=stat["category_name"],
                expense_count=stat["expense_count"],
                total_amount=stat["total_amount"],
            )
            for stat in stats_data
        ]

    async def seed_default_categories(self) -> int:
        """Seed the database with default categories."""
        created_count = 0

        for category_data in DEFAULT_CATEGORIES:
            # Check if category already exists
            existing = await self.repository.get_by_name(category_data["name"])
            if not existing:
                await self.repository.create_default_category(category_data)
                created_count += 1

        # Update categories file for LLM
        await self._update_categories_file()

        return created_count

    async def get_category_names_for_llm(self, user_id: int | None = None) -> list[str]:
        """Get category names formatted for LLM processing."""
        if user_id:
            category_names = await self.repository.get_active_category_names(user_id)
        else:
            # Get all default categories
            default_categories = await self.repository.get_default_categories()
            category_names = [cat.name for cat in default_categories]

        return category_names

    async def _update_categories_file(self) -> None:
        """Update the categories.txt file for LLM integration."""
        try:
            # Ensure data directory exists
            data_dir = Path("data")
            data_dir.mkdir(exist_ok=True)

            # Get all active categories (default + all users' custom categories)
            all_categories = await self.repository.get_all()
            active_categories = [cat for cat in all_categories if cat.is_active]

            # Write to categories file
            categories_file = Path(CATEGORIES_FILE_PATH)
            with categories_file.open("w", encoding="utf-8") as f:
                f.write("# Available expense categories for LLM processing\n")
                f.write("# Format: category_name - description\n\n")

                for category in sorted(active_categories, key=lambda x: x.name):
                    description = category.description or "No description"
                    f.write(f"{category.name} - {description}\n")

        except Exception as e:
            # Log error but don't fail the operation
            print(f"Warning: Failed to update categories file: {e}")

    def get_categories_file_content(self) -> str:
        """Get the content of categories.txt file for LLM processing."""
        try:
            categories_file = Path(CATEGORIES_FILE_PATH)
            if categories_file.exists():
                return categories_file.read_text(encoding="utf-8")
        except Exception as e:
            print(f"Warning: Failed to read categories file: {e}")

        # Return default categories as fallback
        return "\n".join([cat["name"] for cat in DEFAULT_CATEGORIES])
