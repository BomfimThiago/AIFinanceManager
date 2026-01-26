from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from src.shared.constants import Currency, ExpenseCategory


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    description: str
    amount: Decimal
    currency: Currency = Currency.USD
    category: ExpenseCategory
    expense_date: datetime
    store_name: str | None = None
    notes: str | None = None
    receipt_id: int | None = None


class ExpenseUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    description: str | None = None
    amount: Decimal | None = None
    currency: Currency | None = None
    category: str | None = None  # Accepts both default and custom category keys
    expense_date: datetime | None = None
    store_name: str | None = None
    notes: str | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    description: str
    amount: Decimal
    currency: str
    category: str
    expense_date: datetime
    store_name: str | None
    notes: str | None
    receipt_id: int | None
    # Converted amounts
    amount_usd: Decimal | None
    amount_eur: Decimal | None
    amount_brl: Decimal | None
    created_at: datetime
    updated_at: datetime
