"""
Upload History dependencies for dependency injection.

This module contains dependency injection functions for upload history.
"""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.shared.dependencies import get_db
from src.shared.repository import BaseRepository
from src.upload_history.models import UploadHistoryModel
from src.upload_history.service import UploadHistoryService


def get_upload_history_repository(db: AsyncSession = Depends(get_db)) -> BaseRepository:
    """Get upload history repository instance."""
    return BaseRepository(UploadHistoryModel, db)


def get_upload_history_service(
    repository: BaseRepository = Depends(get_upload_history_repository),
) -> UploadHistoryService:
    """Get upload history service instance."""
    return UploadHistoryService(repository)
