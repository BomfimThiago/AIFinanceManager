from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from src.shared.constants import Currency, ExpenseCategory, ReceiptStatus


class ReceiptItemCreate(BaseModel):
    name: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    total_price: Decimal


class ReceiptItemResponse(BaseModel):
    id: int
    name: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    model_config = {"from_attributes": True}


class ReceiptCreate(BaseModel):
    store_name: str | None = None
    total_amount: Decimal | None = None
    currency: Currency = Currency.USD
    purchase_date: datetime | None = None
    category: ExpenseCategory | None = None
    items: list[ReceiptItemCreate] = Field(default_factory=list)


class ReceiptUpdate(BaseModel):
    store_name: str | None = None
    total_amount: Decimal | None = None
    currency: Currency | None = None
    purchase_date: datetime | None = None
    category: ExpenseCategory | None = None


class ReceiptResponse(BaseModel):
    id: int
    store_name: str | None
    total_amount: Decimal | None
    currency: str
    purchase_date: datetime | None
    category: str | None
    status: ReceiptStatus
    image_url: str
    items: list[ReceiptItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReceiptUploadResponse(BaseModel):
    receipt_id: int
    status: ReceiptStatus
    message: str


class ParsedReceiptData(BaseModel):
    store_name: str | None = None
    total_amount: Decimal | None = None
    currency: Currency = Currency.USD
    purchase_date: datetime | None = None
    category: ExpenseCategory = ExpenseCategory.OTHER
    items: list[ReceiptItemCreate] = Field(default_factory=list)
