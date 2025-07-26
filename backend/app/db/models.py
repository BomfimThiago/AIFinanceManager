import enum
from typing import List

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from .base import Base


class ExpenseType(str, enum.Enum):
    """Enum for expense types."""

    EXPENSE = "expense"
    INCOME = "income"


class ExpenseSource(str, enum.Enum):
    """Enum for expense sources."""

    AI_PROCESSED = "ai-processed"
    MANUAL = "manual"
    BELVO_INTEGRATION = "belvo-integration"


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
    integrations = relationship("IntegrationModel", back_populates="user")

    def __repr__(self):
        return f"<UserModel(id={self.id}, email='{self.email}', username='{self.username}')>"


class ExpenseModel(Base):
    """SQLAlchemy model for expenses."""

    __tablename__ = "expenses"

    date = Column(
        String, nullable=False, index=True
    )  # Store as string to match frontend format
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    merchant = Column(String, nullable=False)
    type = Column(SQLEnum(ExpenseType), nullable=False, default=ExpenseType.EXPENSE)
    source = Column(
        SQLEnum(ExpenseSource), nullable=False, default=ExpenseSource.MANUAL
    )
    items = Column(JSON, nullable=True)  # Store list of items as JSON

    # Multi-currency support
    original_currency = Column(
        String, nullable=False, default="EUR"
    )  # Currency of the original amount
    amounts = Column(
        JSON, nullable=True
    )  # Amounts in all supported currencies (USD, EUR, BRL)
    exchange_rates = Column(JSON, nullable=True)  # Exchange rates at time of creation
    exchange_date = Column(
        String, nullable=True
    )  # Date when exchange rates were captured

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
    status = Column(
        SQLEnum(UploadStatus), nullable=False, default=UploadStatus.PROCESSING
    )
    upload_date = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    error_message = Column(Text, nullable=True)  # For error messages

    # Relationship to user
    user = relationship("UserModel", back_populates="upload_history")

    def __repr__(self):
        return f"<UploadHistoryModel(id={self.id}, filename='{self.filename}', status='{self.status}')>"


class IntegrationType(str, enum.Enum):
    """Enum for integration types."""

    PLAID = "plaid"
    BELVO = "belvo"


class IntegrationStatus(str, enum.Enum):
    """Enum for integration status."""

    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"


class IntegrationModel(Base):
    """SQLAlchemy model for bank integrations."""

    __tablename__ = "integrations"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    integration_type = Column(SQLEnum(IntegrationType), nullable=False)
    status = Column(
        SQLEnum(IntegrationStatus),
        nullable=False,
        default=IntegrationStatus.DISCONNECTED,
    )
    account_id = Column(String, nullable=True)  # External account ID from bank
    account_name = Column(String, nullable=True)  # Display name for account
    institution_id = Column(String, nullable=True)  # Bank institution ID
    institution_name = Column(String, nullable=True)  # Bank name
    access_token = Column(Text, nullable=True)  # Encrypted access token
    item_id = Column(String, nullable=True)  # Plaid item ID
    cursor = Column(String, nullable=True)  # For incremental sync
    last_sync = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    # Relationship to user
    user = relationship("UserModel", back_populates="integrations")

    def __repr__(self):
        return f"<IntegrationModel(id={self.id}, type='{self.integration_type}', status='{self.status}')>"


class BelvoInstitutionType(str, enum.Enum):
    """Enum for Belvo institution types."""

    BANK = "bank"
    BUSINESS = "business"
    FISCAL = "fiscal"


class BelvoInstitutionStatus(str, enum.Enum):
    """Enum for Belvo institution status."""

    HEALTHY = "healthy"
    DOWN = "down"
    MAINTENANCE = "maintenance"


class BelvoInstitutionModel(Base):
    """SQLAlchemy model for Belvo institutions."""

    __tablename__ = "belvo_institutions"

    belvo_id = Column(
        Integer, nullable=False, unique=True, index=True
    )  # Belvo's institution ID
    name = Column(String, nullable=False)  # Internal name from Belvo
    display_name = Column(String, nullable=False)  # User-friendly display name
    code = Column(String, nullable=False, unique=True)  # Institution code
    type = Column(SQLEnum(BelvoInstitutionType), nullable=False)
    status = Column(SQLEnum(BelvoInstitutionStatus), nullable=False)
    country_code = Column(
        String(2), nullable=False, index=True
    )  # Primary country (BR, MX, etc.)
    country_codes = Column(
        JSON, nullable=False
    )  # All supported countries as JSON array
    primary_color = Column(String(7), nullable=False)  # Hex color code
    logo = Column(Text, nullable=True)  # Full logo URL
    icon_logo = Column(Text, nullable=True)  # Icon version of logo
    text_logo = Column(Text, nullable=True)  # Text version of logo
    website = Column(String, nullable=True)  # Institution website

    def __repr__(self):
        return f"<BelvoInstitutionModel(id={self.id}, belvo_id={self.belvo_id}, name='{self.display_name}', country='{self.country_code}')>"
