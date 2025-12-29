from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.defaults import DEFAULT_CATEGORIES
from src.categories.models import Category
from src.categories.schemas import CategoryCreate, CategoryUpdate
from src.shared.constants import CategoryType


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, category_data: CategoryCreate, user_id: int) -> Category:
        """Create a new custom category."""
        category = Category(
            user_id=user_id,
            is_default=False,
            is_hidden=False,
            default_category_key=None,
            **category_data.model_dump(),
        )
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def get_by_id(self, category_id: int, user_id: int) -> Category | None:
        """Get a category by ID for a specific user."""
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_user(
        self,
        user_id: int,
        category_type: CategoryType | None = None,
        include_hidden: bool = False,
    ) -> list[Category]:
        """Get all categories for a user."""
        query = select(Category).where(Category.user_id == user_id)

        if category_type:
            query = query.where(Category.type == category_type.value)

        if not include_hidden:
            query = query.where(Category.is_hidden == False)  # noqa: E712

        query = query.order_by(Category.is_default.desc(), Category.name)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_key(self, user_id: int, default_category_key: str) -> Category | None:
        """Get a default category by its key for a specific user."""
        result = await self.db.execute(
            select(Category).where(
                Category.user_id == user_id,
                Category.default_category_key == default_category_key,
            )
        )
        return result.scalar_one_or_none()

    async def update(self, category: Category, update_data: CategoryUpdate) -> Category:
        """Update a category."""
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(category, field, value)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete(self, category: Category) -> None:
        """Delete a category."""
        await self.db.delete(category)
        await self.db.commit()

    async def create_defaults_for_user(self, user_id: int) -> list[Category]:
        """Create all default categories for a new user."""
        categories = []
        for default in DEFAULT_CATEGORIES:
            category = Category(
                user_id=user_id,
                name=default.name,
                type=default.type.value,
                icon=default.icon,
                color=default.color,
                is_default=True,
                is_hidden=False,
                default_category_key=default.key,
            )
            self.db.add(category)
            categories.append(category)

        await self.db.commit()
        for category in categories:
            await self.db.refresh(category)

        return categories

    async def user_has_categories(self, user_id: int) -> bool:
        """Check if a user has any categories."""
        result = await self.db.execute(
            select(Category.id).where(Category.user_id == user_id).limit(1)
        )
        return result.scalar_one_or_none() is not None
