from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.connection import get_db
from ..db.models import UploadHistoryModel
from ..db.repositories import UploadHistoryRepository
from ..models.auth import User
from .auth import get_current_user

router = APIRouter(prefix="/api/upload-history", tags=["upload-history"])


@router.get("/", response_model=List[dict])
async def get_upload_history(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Get upload history for the current user."""
    upload_repo = UploadHistoryRepository(db)
    uploads = await upload_repo.get_all_by_user(current_user.id)

    return [
        {
            "id": upload.id,
            "filename": upload.filename,
            "file_size": upload.file_size,
            "status": upload.status.value,
            "upload_date": upload.upload_date.isoformat(),
            "error_message": upload.error_message,
        }
        for upload in uploads
    ]


@router.delete("/{upload_id}")
async def delete_upload_history(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an upload history record."""
    upload_repo = UploadHistoryRepository(db)

    # Verify the upload belongs to the current user
    upload = await upload_repo.get_by_id(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if upload.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this upload"
        )

    success = await upload_repo.delete(upload_id)
    if not success:
        raise HTTPException(status_code=404, detail="Upload not found")

    return {"message": "Upload history deleted successfully"}
