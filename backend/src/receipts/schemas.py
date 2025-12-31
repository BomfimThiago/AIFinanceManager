from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from src.expenses.schemas import ExpenseResponse
from src.shared.constants import Currency, ExpenseCategory, ReceiptStatus


class ParsedItemData(BaseModel):
    """Data for a single item parsed from a receipt by AI."""

    name: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    total_price: Decimal
    category: str = "other_expense"  # Supports both default and custom categories


class ReceiptUpdate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    store_name: str | None = None
    total_amount: Decimal | None = None
    currency: Currency | None = None
    purchase_date: datetime | None = None
    category: ExpenseCategory | None = None


class ReceiptResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    store_name: str | None
    total_amount: Decimal | None
    currency: str
    purchase_date: datetime | None
    category: str | None
    status: ReceiptStatus
    image_url: str
    expenses: list[ExpenseResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ReceiptUploadResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    receipt_id: int
    status: ReceiptStatus
    message: str


class ParsedReceiptData(BaseModel):
    """Data parsed from a receipt by AI."""

    store_name: str | None = None
    total_amount: Decimal | None = None
    currency: Currency = Currency.USD
    purchase_date: datetime | None = None
    category: str = "other"  # Supports both default and custom categories
    items: list[ParsedItemData] = Field(default_factory=list)
