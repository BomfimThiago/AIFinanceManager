from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.models import UserCategoryPreference


class CategoryPreferenceRepository:
    """Repository for user category preference operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: int,
        item_name_pattern: str,
        target_category: str,
        store_name_pattern: str | None = None,
        original_category: str | None = None,
        source_expense_id: int | None = None,
    ) -> UserCategoryPreference:
        """Create a new category preference."""
        preference = UserCategoryPreference(
            user_id=user_id,
            item_name_pattern=item_name_pattern,
            store_name_pattern=store_name_pattern,
            target_category=target_category,
            original_category=original_category,
            source_expense_id=source_expense_id,
            confidence_score=1.0,
            correction_count=1,
            last_used_at=datetime.now(UTC),
        )
        self.db.add(preference)
        await self.db.commit()
        await self.db.refresh(preference)
        return preference

    async def find_preference(
        self,
        user_id: int,
        item_pattern: str,
        store_pattern: str | None = None,
    ) -> UserCategoryPreference | None:
        """Find an exact match preference for an item pattern."""
        query = select(UserCategoryPreference).where(
            UserCategoryPreference.user_id == user_id,
            UserCategoryPreference.item_name_pattern == item_pattern,
        )

        if store_pattern:
            query = query.where(
                UserCategoryPreference.store_name_pattern == store_pattern
            )
        else:
            query = query.where(UserCategoryPreference.store_name_pattern.is_(None))

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_top_preferences(
        self,
        user_id: int,
        limit: int = 50,
    ) -> list[UserCategoryPreference]:
        """Get top preferences ordered by confidence and recency."""
        result = await self.db.execute(
            select(UserCategoryPreference)
            .where(UserCategoryPreference.user_id == user_id)
            .order_by(
                UserCategoryPreference.confidence_score.desc(),
                UserCategoryPreference.last_used_at.desc(),
            )
            .limit(limit)
        )
        return list(result.scalars().all())

    async def reinforce_preference(
        self,
        preference: UserCategoryPreference,
    ) -> UserCategoryPreference:
        """Increase confidence when same correction is made again.

        Confidence increases by 0.5 up to a maximum of 5.0.
        """
        preference.correction_count += 1
        preference.confidence_score = min(5.0, preference.confidence_score + 0.5)
        preference.last_used_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(preference)
        return preference

    async def update_preference(
        self,
        preference: UserCategoryPreference,
        target_category: str,
        original_category: str | None = None,
    ) -> UserCategoryPreference:
        """Update preference when user changes to a different category.

        Resets confidence to 1.0 since the user is changing their preference.
        """
        preference.target_category = target_category
        preference.original_category = original_category
        preference.confidence_score = 1.0
        preference.correction_count = 1
        preference.last_used_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(preference)
        return preference

    async def delete(self, preference: UserCategoryPreference) -> None:
        """Delete a preference."""
        await self.db.delete(preference)
        await self.db.commit()

    async def get_by_id(
        self,
        preference_id: int,
        user_id: int,
    ) -> UserCategoryPreference | None:
        """Get a preference by ID for a specific user."""
        result = await self.db.execute(
            select(UserCategoryPreference).where(
                UserCategoryPreference.id == preference_id,
                UserCategoryPreference.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
