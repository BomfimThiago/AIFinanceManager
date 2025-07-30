"""
Upload History API router.

This module contains the FastAPI router for upload history endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.upload_history.dependencies import get_upload_history_service
from src.upload_history.schemas import UploadHistory
from src.upload_history.service import UploadHistoryService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/upload-history", tags=["upload-history"])


@router.get("/", response_model=list[UploadHistory])
async def get_upload_history(
    current_user: User = Depends(get_current_user),
    upload_service: UploadHistoryService = Depends(get_upload_history_service),
) -> list[UploadHistory]:
    """Get upload history for the current user."""
    try:
        logger.info(f"Getting upload history for user {current_user.id}")
        uploads = await upload_service.get_user_uploads(current_user.id)
        return uploads
    except Exception as e:
        logger.error(f"Error getting upload history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve upload history",
        ) from e


@router.delete("/{upload_id}")
async def delete_upload_history(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    upload_service: UploadHistoryService = Depends(get_upload_history_service),
):
    """Delete an upload history record."""
    try:
        logger.info(f"Deleting upload {upload_id} for user {current_user.id}")

        # First, check if the upload exists and belongs to the user
        uploads = await upload_service.get_user_uploads(current_user.id)
        upload_exists = any(upload.id == upload_id for upload in uploads)

        if not upload_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found or not authorized to delete",
            )

        success = await upload_service.delete_upload(upload_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found",
            )

        return {"message": "Upload history deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting upload history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete upload history",
        ) from e
