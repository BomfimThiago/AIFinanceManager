from sqlalchemy import Column, String, Float, Text, Enum as SQLEnum, JSON, Boolean, DateTime, func, Integer, ForeignKey
from sqlalchemy.orm import relationship
import enum

from .base import Base


class ExpenseType(str, enum.Enum):
    """Enum for expense types."""
    EXPENSE = "expense"
    INCOME = "income"


class ExpenseSource(str, enum.Enum):
    """Enum for expense sources."""
    AI_PROCESSED = "ai-processed"
    MANUAL = "manual"


class UserModel(Base):
    """SQLAlchemy model for users."""
    __tablename__ = "users"

    email = Column(String, nullable=False, unique=True, index=True)
    username = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Relationships
    upload_history = relationship("UploadHistoryModel", back_populates="user")

    def __repr__(self):
        return f"<UserModel(id={self.id}, email='{self.email}', username='{self.username}')>"


class ExpenseModel(Base):
    """SQLAlchemy model for expenses."""
    __tablename__ = "expenses"

    date = Column(String, nullable=False, index=True)  # Store as string to match frontend format
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    merchant = Column(String, nullable=False)
    type = Column(SQLEnum(ExpenseType), nullable=False, default=ExpenseType.EXPENSE)
    source = Column(SQLEnum(ExpenseSource), nullable=False, default=ExpenseSource.MANUAL)
    items = Column(JSON, nullable=True)  # Store list of items as JSON

    def __repr__(self):
        return f"<ExpenseModel(id={self.id}, amount={self.amount}, category='{self.category}')>"


class BudgetModel(Base):
    """SQLAlchemy model for budgets."""
    __tablename__ = "budgets"

    category = Column(String, nullable=False, unique=True, index=True)
    limit_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, nullable=False, default=0.0)

    def __repr__(self):
        return f"<BudgetModel(id={self.id}, category='{self.category}', limit={self.limit_amount})>"


class InsightModel(Base):
    """SQLAlchemy model for AI insights."""
    __tablename__ = "insights"

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # warning, success, info
    actionable = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<InsightModel(id={self.id}, title='{self.title}', type='{self.type}')>"


class UploadStatus(str, enum.Enum):
    """Enum for upload status."""
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class UploadHistoryModel(Base):
    """SQLAlchemy model for upload history."""
    __tablename__ = "upload_history"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(SQLEnum(UploadStatus), nullable=False, default=UploadStatus.PROCESSING)
    upload_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    error_message = Column(Text, nullable=True)  # For error messages

    # Relationship to user
    user = relationship("UserModel", back_populates="upload_history")

    def __repr__(self):
        return f"<UploadHistoryModel(id={self.id}, filename='{self.filename}', status='{self.status}')>"