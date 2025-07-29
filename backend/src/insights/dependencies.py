"""
Insight dependencies.

This module contains the FastAPI dependencies for insight operations.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_database_session
from src.insights.repository import InsightRepository
from src.insights.service import InsightService


async def get_insight_repository(
    session: AsyncSession = Depends(get_database_session),
) -> InsightRepository:
    """Get insight repository dependency."""
    return InsightRepository(session)


async def get_insight_service(
    repository: InsightRepository = Depends(get_insight_repository),
) -> InsightService:
    """Get insight service dependency."""
    return InsightService(repository)
