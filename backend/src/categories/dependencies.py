"""
Category dependencies for dependency injection.

This module provides FastAPI dependencies for category-related operations.
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.service import CategoryService
from src.shared.dependencies import get_current_user_id, get_db


async def get_category_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CategoryService:
    """Get category service instance."""
    return CategoryService(db)


async def get_current_user_category_service(
    user_id: Annotated[int, Depends(get_current_user_id())],
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> tuple[int, CategoryService]:
    """Get current user ID and category service."""
    return user_id, service
