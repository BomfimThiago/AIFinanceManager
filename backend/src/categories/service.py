from src.categories.models import Category
from src.categories.repository import CategoryRepository
from src.categories.schemas import CategoryCreate, CategoryUpdate
from src.shared.constants import CategoryType
from src.shared.exceptions import BadRequestError, NotFoundError


class CategoryService:
    def __init__(self, repository: CategoryRepository):
        self.repository = repository

    async def create_category(
        self,
        category_data: CategoryCreate,
        user_id: int,
    ) -> Category:
        """Create a new custom category."""
        return await self.repository.create(category_data, user_id)

    async def get_category(self, category_id: int, user_id: int) -> Category:
        """Get a category by ID."""
        category = await self.repository.get_by_id(category_id, user_id)
        if not category:
            raise NotFoundError("Category", category_id)
        return category

    async def get_all_categories(
        self,
        user_id: int,
        category_type: CategoryType | None = None,
        include_hidden: bool = False,
    ) -> list[Category]:
        """Get all categories for a user."""
        return await self.repository.get_all_by_user(
            user_id,
            category_type=category_type,
            include_hidden=include_hidden,
        )

    async def update_category(
        self,
        category_id: int,
        user_id: int,
        update_data: CategoryUpdate,
    ) -> Category:
        """Update a category."""
        category = await self.get_category(category_id, user_id)

        # Default categories can only be hidden, not have name/icon/color changed
        if category.is_default:
            # Only allow is_hidden to be updated for default categories
            has_forbidden_update = (
                update_data.name is not None
                or update_data.icon is not None
                or update_data.color is not None
            )
            if has_forbidden_update:
                raise BadRequestError(
                    "Default categories can only be hidden, not modified. "
                    "Create a custom category instead."
                )

        return await self.repository.update(category, update_data)

    async def delete_category(self, category_id: int, user_id: int) -> None:
        """Delete a category. Only custom categories can be deleted."""
        category = await self.get_category(category_id, user_id)

        if category.is_default:
            raise BadRequestError(
                "Default categories cannot be deleted. You can hide them instead."
            )

        await self.repository.delete(category)

    async def hide_category(self, category_id: int, user_id: int) -> Category:
        """Hide a category (convenience method)."""
        update_data = CategoryUpdate(is_hidden=True)
        return await self.update_category(category_id, user_id, update_data)

    async def unhide_category(self, category_id: int, user_id: int) -> Category:
        """Unhide a category (convenience method)."""
        update_data = CategoryUpdate(is_hidden=False)
        return await self.update_category(category_id, user_id, update_data)

    async def initialize_user_categories(self, user_id: int) -> list[Category]:
        """Initialize default categories for a new user."""
        # Check if user already has categories (prevent duplicates)
        if await self.repository.user_has_categories(user_id):
            return await self.repository.get_all_by_user(user_id, include_hidden=True)

        return await self.repository.create_defaults_for_user(user_id)

    async def get_category_by_key(
        self,
        user_id: int,
        default_category_key: str,
    ) -> Category | None:
        """Get a default category by its key."""
        return await self.repository.get_by_key(user_id, default_category_key)
