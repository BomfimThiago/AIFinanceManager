"""
Upload History SQLAlchemy models.

This module contains the database models for upload history.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base
from src.upload_history.schemas import UploadStatus


class UploadHistoryModel(Base):
    """SQLAlchemy model for upload history."""

    __tablename__ = "upload_history"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Upload fields
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[UploadStatus] = mapped_column(
        SQLEnum(UploadStatus), nullable=False, default=UploadStatus.PROCESSING
    )
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationship to user (will be added when user model is available)
    # user = relationship("UserModel", back_populates="upload_history")

    def __repr__(self):
        return f"<UploadHistoryModel(id={self.id}, filename='{self.filename}', status='{self.status}')>"
