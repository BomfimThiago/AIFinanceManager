"""
Insight service for business logic.

This module contains the service class for AI insights-related business operations.
"""

import logging

from src.insights.models import InsightModel
from src.insights.repository import InsightRepository
from src.insights.schemas import AIInsight, Insight, InsightCreate, InsightSummary
from src.services.ai_service import ai_service
from src.shared.constants import InsightType

logger = logging.getLogger(__name__)


class InsightService:
    """Service for AI insights business logic."""

    def __init__(self, repository: InsightRepository):
        self.repository = repository

    def _model_to_schema(self, insight_model: InsightModel) -> Insight:
        """Convert SQLAlchemy model to Pydantic schema."""
        return Insight(
            id=getattr(insight_model, 'id', 0),
            title=insight_model.title,
            message=insight_model.message,
            type=insight_model.type,
            actionable=insight_model.actionable,
            created_at=insight_model.created_at,
            updated_at=insight_model.updated_at,
        )

    def _model_to_ai_insight(self, insight_model: InsightModel) -> AIInsight:
        """Convert SQLAlchemy model to AIInsight schema for compatibility."""
        return AIInsight(
            title=insight_model.title,
            message=insight_model.message,
            type=insight_model.type,
            actionable=insight_model.actionable,
        )

    async def get_all(self) -> list[Insight]:
        """Get all insights."""
        insight_models = await self.repository.get_all()
        return [self._model_to_schema(insight) for insight in insight_models]

    async def get_all_as_ai_insights(self) -> list[AIInsight]:
        """Get all insights as AIInsight objects for compatibility."""
        insight_models = await self.repository.get_all()
        return [self._model_to_ai_insight(insight) for insight in insight_models]

    async def create(self, insight_data: InsightCreate) -> Insight:
        """Create a new insight."""
        insight_model = await self.repository.create(insight_data)
        return self._model_to_schema(insight_model)

    async def generate_insights(self, expenses, budgets_dict) -> list[AIInsight]:
        """Generate AI insights based on expenses and budgets."""
        try:
            logger.info("Generating AI insights based on current data")

            # Generate insights using AI service
            insights = await ai_service.generate_insights(expenses, budgets_dict)

            # Store insights in database (clear old ones first)
            await self.repository.delete_all()
            await self.repository.create_multiple_from_ai_insights(insights)

            logger.info(f"Generated and stored {len(insights)} insights")
            return insights
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return []

    async def delete_all(self) -> int:
        """Delete all insights."""
        return await self.repository.delete_all()

    async def get_summary(self) -> InsightSummary:
        """Get insight summary with counts by type."""
        insights = await self.get_all()

        warning_count = sum(1 for insight in insights if insight.type == InsightType.WARNING)
        success_count = sum(1 for insight in insights if insight.type == InsightType.SUCCESS)
        info_count = sum(1 for insight in insights if insight.type == InsightType.INFO)

        return InsightSummary(
            total_insights=len(insights),
            warning_count=warning_count,
            success_count=success_count,
            info_count=info_count,
            insights=insights
        )
