"""
Upload History service for business logic.

This module contains the service class for upload history operations.
"""


from src.shared.repository import BaseRepository
from src.upload_history.models import UploadHistoryModel
from src.upload_history.schemas import (
    UploadHistory,
    UploadHistoryCreate,
    UploadHistoryUpdate,
    UploadStatus,
)


class UploadHistoryService:
    """Service for upload history business logic."""

    def __init__(self, repository: BaseRepository):
        self.repository = repository

    def _model_to_schema(self, model: UploadHistoryModel) -> UploadHistory:
        """Convert SQLAlchemy model to Pydantic schema."""
        return UploadHistory(
            id=getattr(model, 'id', 0),
            user_id=model.user_id,
            filename=model.filename,
            file_size=model.file_size,
            status=model.status,
            upload_date=model.upload_date,
            error_message=model.error_message,
            created_at=getattr(model, 'created_at', model.upload_date),
            updated_at=getattr(model, 'updated_at', model.upload_date),
        )

    async def create_upload_record(
        self, user_id: int, filename: str, file_size: int, status: UploadStatus
    ) -> UploadHistory:
        """Create a new upload history record."""
        upload_data = UploadHistoryCreate(
            user_id=user_id,
            filename=filename,
            file_size=file_size,
            status=status,
        )
        model = await self.repository.create(upload_data)
        return self._model_to_schema(model)

    async def update_upload_status(
        self, upload_id: int, status: UploadStatus, error_message: str | None = None
    ) -> UploadHistory:
        """Update upload status and error message."""
        update_data = UploadHistoryUpdate(
            status=status,
            error_message=error_message,
        )
        model = await self.repository.update(upload_id, update_data)
        return self._model_to_schema(model)

    async def get_user_uploads(self, user_id: int) -> list[UploadHistory]:
        """Get all uploads for a user."""
        # Use repository filtering to get uploads by user_id efficiently
        models, _ = await self.repository.get_multi(
            filters={"user_id": user_id},
            order_by="upload_date",
            order_desc=True
        )
        return [self._model_to_schema(model) for model in models]

    async def delete_upload(self, upload_id: int) -> bool:
        """Delete an upload record."""
        return await self.repository.delete(upload_id)
