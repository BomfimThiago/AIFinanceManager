from sqlalchemy import Column, String, Float, Text, Enum as SQLEnum, JSON
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