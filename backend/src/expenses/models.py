from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.shared.models import BaseModel

if TYPE_CHECKING:
    from src.receipts.models import Receipt


class Expense(BaseModel):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    receipt_id: Mapped[int | None] = mapped_column(ForeignKey("receipts.id"), nullable=True)

    # Expense data
    description: Mapped[str] = mapped_column(String(255))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    category: Mapped[str] = mapped_column(String(50))
    expense_date: Mapped[datetime | None] = mapped_column(nullable=True)

    # Converted amounts (historical rates at expense date)
    amount_usd: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    amount_eur: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    amount_brl: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Optional metadata
    store_name: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="expenses")  # noqa: F821
    receipt: Mapped["Receipt | None"] = relationship(back_populates="expenses")
