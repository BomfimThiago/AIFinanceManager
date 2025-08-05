"""
Category repository for database operations.

This module contains the repository class for category-related database operations.
"""

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.models import CategoryModel, CategoryType
from src.categories.schemas import CategoryCreate, CategoryUpdate
from src.expenses.models import ExpenseModel
from src.shared.repository import BaseRepository


class CategoryRepository(BaseRepository[CategoryModel, CategoryCreate, CategoryUpdate]):
    """Repository for category database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(CategoryModel, db)

    async def get_by_name(self, name: str) -> CategoryModel | None:
        """Get category by name."""
        query = select(self.model).where(self.model.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_categories(
        self, user_id: int, include_default: bool = True
    ) -> list[CategoryModel]:
        """Get categories for a specific user, optionally including default categories."""
        conditions = []

        if include_default:
            # Get user's custom categories OR default categories
            conditions.append((self.model.user_id == user_id) | (self.model.is_default))
        else:
            # Get only user's custom categories
            conditions.append(self.model.user_id == user_id)

        # Only active categories
        conditions.append(self.model.is_active)

        query = select(self.model).where(and_(*conditions)).order_by(self.model.name)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_default_categories(self) -> list[CategoryModel]:
        """Get all default categories."""
        query = (
            select(self.model)
            .where(and_(self.model.is_default, self.model.is_active))
            .order_by(self.model.name)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_user_category(
        self,
        user_id: int,
        category_data: CategoryCreate,
        translations: dict | None = None,
    ) -> CategoryModel:
        """Create a custom category for a user."""
        db_obj = self.model(
            **category_data.model_dump(),
            user_id=user_id,
            is_default=False,
            is_active=True,
            translations=translations,
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def create_default_category(self, category_data: dict) -> CategoryModel:
        """Create a default system category."""
        # Convert category_type string to enum if needed
        processed_data = category_data.copy()
        if "category_type" in processed_data and isinstance(
            processed_data["category_type"], str
        ):
            processed_data["category_type"] = CategoryType(
                processed_data["category_type"]
            )

        db_obj = self.model(
            **processed_data, user_id=None, is_default=True, is_active=True
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def category_exists(self, name: str, user_id: int | None = None) -> bool:
        """Check if a category exists (for user or as default)."""
        conditions = [self.model.name == name]

        if user_id:
            # Check if category exists for this user OR as default
            conditions.append((self.model.user_id == user_id) | (self.model.is_default))
        else:
            # Check only default categories
            conditions.append(self.model.is_default)

        query = select(self.model).where(and_(*conditions))
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_category_stats(self, user_id: int) -> list[dict]:
        """Get category usage statistics for a user."""

        # Query to get category stats with expense counts and totals
        query = (
            select(
                CategoryModel.id,
                CategoryModel.name,
                func.count(ExpenseModel.id).label("expense_count"),
                func.coalesce(func.sum(ExpenseModel.amount), 0).label("total_amount"),
            )
            .outerjoin(ExpenseModel, CategoryModel.name == ExpenseModel.category)
            .where(
                and_(
                    CategoryModel.is_active,
                    (CategoryModel.user_id == user_id) | (CategoryModel.is_default),
                )
            )
            .group_by(CategoryModel.id, CategoryModel.name)
            .order_by(func.sum(ExpenseModel.amount).desc().nullslast())
        )

        result = await self.db.execute(query)
        return [
            {
                "category_id": row.id,
                "category_name": row.name,
                "expense_count": row.expense_count,
                "total_amount": float(row.total_amount),
            }
            for row in result.all()
        ]

    async def deactivate_category(self, category_id: int, user_id: int) -> bool:
        """Deactivate a user's custom category (soft delete)."""
        category = await self.get_by_id(category_id)
        if not category or category.is_default or category.user_id != user_id:
            return False

        category.is_active = False
        await self.db.commit()
        return True

    async def get_active_category_names(self, user_id: int) -> list[str]:
        """Get list of active category names for a user (including defaults)."""
        categories = await self.get_user_categories(user_id, include_default=True)
        return [category.name for category in categories]
