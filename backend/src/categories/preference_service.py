from src.categories.models import UserCategoryPreference
from src.categories.preference_repository import CategoryPreferenceRepository


class CategoryPreferenceService:
    """Service for managing user category preferences.

    This service handles learning from user corrections and retrieving
    preferences for AI classification.
    """

    def __init__(self, repository: CategoryPreferenceRepository):
        self.repository = repository

    async def learn_from_correction(
        self,
        user_id: int,
        item_name: str,
        corrected_category: str,
        store_name: str | None = None,
        original_category: str | None = None,
        source_expense_id: int | None = None,
    ) -> UserCategoryPreference:
        """Learn a category preference from a user correction.

        When a user changes the category of an expense, we store this preference
        so the AI can learn from it for future classifications.

        Args:
            user_id: The user making the correction
            item_name: The item description being classified
            corrected_category: The category the user wants
            store_name: Optional store context for more specific matching
            original_category: What the AI originally classified it as
            source_expense_id: The expense that triggered this correction

        Returns:
            The created or updated preference
        """
        normalized_item = self._normalize_text(item_name)
        normalized_store = self._normalize_text(store_name) if store_name else None

        # Check for existing preference with this exact pattern
        existing = await self.repository.find_preference(
            user_id=user_id,
            item_pattern=normalized_item,
            store_pattern=normalized_store,
        )

        if existing:
            if existing.target_category == corrected_category:
                # Same correction again - reinforce the preference
                return await self.repository.reinforce_preference(existing)
            else:
                # Different correction - update the target category
                return await self.repository.update_preference(
                    preference=existing,
                    target_category=corrected_category,
                    original_category=original_category,
                )
        else:
            # Create new preference
            return await self.repository.create(
                user_id=user_id,
                item_name_pattern=normalized_item,
                store_name_pattern=normalized_store,
                target_category=corrected_category,
                original_category=original_category,
                source_expense_id=source_expense_id,
            )

    async def get_preferences_for_ai_prompt(
        self,
        user_id: int,
        limit: int = 50,
    ) -> list[UserCategoryPreference]:
        """Get top preferences to include in AI prompt.

        Returns preferences ordered by confidence score (highest first),
        limited to avoid making the prompt too long.

        Args:
            user_id: The user to get preferences for
            limit: Maximum number of preferences to return

        Returns:
            List of preferences ordered by confidence
        """
        return await self.repository.get_top_preferences(user_id, limit)

    def _normalize_text(self, text: str) -> str:
        """Normalize text for consistent matching.

        Converts to lowercase, strips whitespace, and removes extra spaces.
        This ensures "UBER RIDE" and "uber ride" match the same preference.
        """
        if not text:
            return ""
        # Lowercase, strip whitespace, dedupe spaces
        return " ".join(text.lower().strip().split())
