from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.currency.service import CurrencyService, get_currency_service
from src.expenses.models import Expense
from src.receipts.models import Receipt
from src.receipts.schemas import ParsedReceiptData, ReceiptUpdate
from src.shared.constants import ReceiptStatus


class ReceiptRepository:
    def __init__(self, db: AsyncSession, currency_service: CurrencyService | None = None):
        self.db = db
        self.currency_service = currency_service or get_currency_service()

    async def create(
        self,
        user_id: int,
        image_url: str,
        status: ReceiptStatus = ReceiptStatus.PENDING,
    ) -> Receipt:
        receipt = Receipt(user_id=user_id, image_url=image_url, status=status)
        self.db.add(receipt)
        await self.db.commit()
        await self.db.refresh(receipt)
        return receipt

    async def get_by_id(self, receipt_id: int, user_id: int) -> Receipt | None:
        result = await self.db.execute(
            select(Receipt)
            .options(selectinload(Receipt.expenses))
            .where(Receipt.id == receipt_id, Receipt.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Receipt]:
        result = await self.db.execute(
            select(Receipt)
            .options(selectinload(Receipt.expenses))
            .where(Receipt.user_id == user_id)
            .order_by(Receipt.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update(
        self,
        receipt: Receipt,
        update_data: ReceiptUpdate,
    ) -> Receipt:
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(receipt, field, value)
        await self.db.commit()
        await self.db.refresh(receipt)
        return receipt

    async def update_with_parsed_data(
        self,
        receipt: Receipt,
        parsed_data: ParsedReceiptData,
        raw_text: str,
    ) -> Receipt:
        receipt.store_name = parsed_data.store_name
        receipt.total_amount = parsed_data.total_amount
        receipt.currency = parsed_data.currency
        receipt.purchase_date = parsed_data.purchase_date
        receipt.category = parsed_data.category
        receipt.raw_text = raw_text
        receipt.status = ReceiptStatus.COMPLETED

        # Default expense date (naive datetime for PostgreSQL TIMESTAMP WITHOUT TIME ZONE)
        expense_date = parsed_data.purchase_date or datetime.utcnow()

        # Create expense for each parsed item
        currency_str = parsed_data.currency.value if parsed_data.currency else "USD"

        for item_data in parsed_data.items:
            # Convert amount to all supported currencies using historical rates
            converted = await self.currency_service.convert_amount(
                amount=item_data.total_price,
                from_currency=currency_str,
                expense_date=expense_date,
            )

            expense = Expense(
                user_id=receipt.user_id,
                receipt_id=receipt.id,
                description=item_data.name,
                amount=item_data.total_price,
                currency=currency_str,
                category=parsed_data.category.value if parsed_data.category else "other",
                expense_date=expense_date,
                store_name=parsed_data.store_name,
                amount_usd=converted["amount_usd"],
                amount_eur=converted["amount_eur"],
                amount_brl=converted["amount_brl"],
            )
            self.db.add(expense)

        await self.db.commit()
        await self.db.refresh(receipt)
        return receipt

    async def set_failed(self, receipt: Receipt, error_message: str) -> Receipt:
        receipt.status = ReceiptStatus.FAILED
        receipt.error_message = error_message
        await self.db.commit()
        await self.db.refresh(receipt)
        return receipt

    async def delete(self, receipt: Receipt) -> None:
        await self.db.delete(receipt)
        await self.db.commit()
