from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from src.shared.constants import Currency, ExpenseCategory


class ExpenseCreate(BaseModel):
    description: str
    amount: Decimal
    currency: Currency = Currency.USD
    category: ExpenseCategory
    expense_date: datetime
    store_name: str | None = None
    notes: str | None = None
    receipt_id: int | None = None


class ExpenseUpdate(BaseModel):
    description: str | None = None
    amount: Decimal | None = None
    currency: Currency | None = None
    category: ExpenseCategory | None = None
    expense_date: datetime | None = None
    store_name: str | None = None
    notes: str | None = None


class ExpenseResponse(BaseModel):
    id: int
    description: str
    amount: Decimal
    currency: str
    category: str
    expense_date: datetime
    store_name: str | None
    notes: str | None
    receipt_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseSummary(BaseModel):
    total_amount: Decimal
    currency: str
    category: str
    count: int
