"""
Upload History Pydantic schemas.

This module contains Pydantic models for upload history data.
"""

import enum
from datetime import datetime

from pydantic import Field

from src.shared.models import CustomModel, TimestampMixin


class UploadStatus(str, enum.Enum):
    """Enum for upload status."""
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class UploadHistoryBase(CustomModel):
    """Base upload history model."""

    filename: str = Field(description="Original filename")
    file_size: int = Field(description="File size in bytes")
    status: UploadStatus = Field(description="Upload status")
    error_message: str | None = Field(None, description="Error message if failed")


class UploadHistoryCreate(UploadHistoryBase):
    """Schema for creating upload history record."""

    user_id: int = Field(description="User ID")


class UploadHistory(UploadHistoryBase, TimestampMixin):
    """Complete upload history model."""

    id: int = Field(description="Record ID")
    user_id: int = Field(description="User ID")
    upload_date: datetime = Field(description="Upload timestamp")

    class Config:
        from_attributes = True


class UploadHistoryUpdate(CustomModel):
    """Schema for updating upload history."""

    status: UploadStatus | None = Field(None, description="Upload status")
    error_message: str | None = Field(None, description="Error message")
