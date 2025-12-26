from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.shared.constants import Currency, ReceiptStatus
from src.shared.models import BaseModel


class Receipt(BaseModel):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Receipt data
    image_url: Mapped[str] = mapped_column(String(500))
    raw_text: Mapped[str | None] = mapped_column(Text)

    # Extracted data
    store_name: Mapped[str | None] = mapped_column(String(255))
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default=Currency.USD)
    purchase_date: Mapped[datetime | None]
    category: Mapped[str | None] = mapped_column(String(50))

    # Processing status
    status: Mapped[str] = mapped_column(String(20), default=ReceiptStatus.PENDING)
    error_message: Mapped[str | None] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="receipts")  # noqa: F821
    items: Mapped[list["ReceiptItem"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan"
    )


class ReceiptItem(BaseModel):
    __tablename__ = "receipt_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    receipt_id: Mapped[int] = mapped_column(ForeignKey("receipts.id"), index=True)

    name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    # Relationship
    receipt: Mapped["Receipt"] = relationship(back_populates="items")
