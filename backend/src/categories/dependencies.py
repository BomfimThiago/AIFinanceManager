from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.categories.preference_repository import CategoryPreferenceRepository
from src.categories.preference_service import CategoryPreferenceService
from src.categories.repository import CategoryRepository
from src.categories.service import CategoryService
from src.database import get_db


def get_category_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CategoryRepository:
    return CategoryRepository(db)


def get_category_service(
    repository: Annotated[CategoryRepository, Depends(get_category_repository)],
) -> CategoryService:
    return CategoryService(repository)


def get_preference_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CategoryPreferenceRepository:
    return CategoryPreferenceRepository(db)


def get_preference_service(
    repository: Annotated[CategoryPreferenceRepository, Depends(get_preference_repository)],
) -> CategoryPreferenceService:
    return CategoryPreferenceService(repository)
