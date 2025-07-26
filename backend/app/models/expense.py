from datetime import datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    date: str
    amount: float
    category: str
    description: str
    merchant: str
    type: Literal["expense", "income"]
    source: Optional[Literal["ai-processed", "manual", "belvo-integration"]] = "manual"
    items: Optional[List[str]] = None
    # Multi-currency support
    original_currency: Optional[str] = "EUR"  # Currency of the original amount
    amounts: Optional[Dict[str, float]] = None  # Amounts in all supported currencies
    exchange_rates: Optional[Dict[str, float]] = (
        None  # Exchange rates at time of creation
    )
    exchange_date: Optional[str] = None  # Date when exchange rates were captured


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: int

    class Config:
        from_attributes = True


class Budget(BaseModel):
    limit: float
    spent: float


class BudgetCreate(BaseModel):
    category: str
    limit: float


class AIInsight(BaseModel):
    title: str
    message: str
    type: Literal["warning", "success", "info"]
    actionable: Optional[str] = None


class CategoryData(BaseModel):
    name: str
    value: float
    color: str


class MonthlyData(BaseModel):
    month: str
    income: float
    expenses: float
