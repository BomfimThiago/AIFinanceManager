"""
Insight repository for database operations.

This module contains the repository class for AI insights-related database operations.
"""

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.insights.models import InsightModel
from src.insights.schemas import AIInsight, InsightCreate, InsightUpdate
from src.shared.repository import BaseRepository


class InsightRepository(BaseRepository[InsightModel, InsightCreate, InsightUpdate]):
    """Repository for AI insights database operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(InsightModel, db)
        self.db = db

    async def create_from_ai_insight(self, insight_data: AIInsight) -> InsightModel:
        """Create a new insight from AI insight data."""
        db_insight = InsightModel(
            title=insight_data.title,
            message=insight_data.message,
            type=insight_data.type,
            actionable=insight_data.actionable,
        )
        self.db.add(db_insight)
        await self.db.commit()
        await self.db.refresh(db_insight)
        return db_insight

    async def create_multiple_from_ai_insights(
        self, insights: list[AIInsight]
    ) -> list[InsightModel]:
        """Create multiple insights from AI insight data."""
        db_insights = []
        for insight_data in insights:
            db_insight = InsightModel(
                title=insight_data.title,
                message=insight_data.message,
                type=insight_data.type,
                actionable=insight_data.actionable,
            )
            self.db.add(db_insight)
            db_insights.append(db_insight)

        await self.db.commit()

        # Refresh all insights to get IDs and timestamps
        for db_insight in db_insights:
            await self.db.refresh(db_insight)

        return db_insights

    async def delete_all(self) -> int:
        """Delete all insights and return the number deleted."""
        result = await self.db.execute(delete(InsightModel))
        await self.db.commit()
        return result.rowcount

    async def get_by_type(self, insight_type: str) -> list[InsightModel]:
        """Get insights by type (warning, success, info)."""
        results, _ = await self.get_multi(filters={"type": insight_type})
        return results
