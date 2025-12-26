import json
import logging
from datetime import datetime
from decimal import Decimal

from anthropic import Anthropic

from src.config import get_settings
from src.receipts.schemas import ParsedItemData, ParsedReceiptData
from src.shared.constants import Currency, ExpenseCategory

settings = get_settings()
logger = logging.getLogger(__name__)

PARSE_PROMPT = """Analyze this receipt text and extract the following information in JSON format:

{
    "store_name": "Name of the store/merchant",
    "total_amount": 0.00,
    "currency": "USD|EUR|BRL|GBP",
    "purchase_date": "YYYY-MM-DD",
    "category": "groceries|dining|transportation|utilities|entertainment|...",
    "items": [
        {
            "name": "Item name",
            "quantity": 1,
            "unit_price": 0.00,
            "total_price": 0.00
        }
    ]
}

Rules:
- If a field cannot be determined, use null
- Currency should be inferred from symbols or text ($ = USD, € = EUR, R$ = BRL, £ = GBP)
- Category should be inferred from the store name and items
- For items, extract as many as you can identify
- All prices should be numbers, not strings

Receipt text:
"""


class AIParser:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)

    async def parse_receipt(self, ocr_text: str) -> ParsedReceiptData:
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": f"{PARSE_PROMPT}\n{ocr_text}",
                    }
                ],
            )

            response_text = message.content[0].text

            # Extract JSON from response
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start == -1 or json_end == 0:
                logger.error("No JSON found in AI response")
                return ParsedReceiptData()

            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)

            return self._parse_response(data)

        except Exception as e:
            logger.error(f"AI parsing error: {e}")
            return ParsedReceiptData()

    def _parse_response(self, data: dict) -> ParsedReceiptData:
        items = []
        for item in data.get("items", []):
            try:
                items.append(
                    ParsedItemData(
                        name=item.get("name", "Unknown"),
                        quantity=Decimal(str(item.get("quantity", 1))),
                        unit_price=Decimal(str(item.get("unit_price", 0))),
                        total_price=Decimal(str(item.get("total_price", 0))),
                    )
                )
            except (ValueError, TypeError):
                continue

        # Parse date
        purchase_date = None
        if data.get("purchase_date"):
            try:
                purchase_date = datetime.strptime(data["purchase_date"], "%Y-%m-%d")
            except ValueError:
                pass

        # Parse currency
        currency = Currency.USD
        if data.get("currency") in [c.value for c in Currency]:
            currency = Currency(data["currency"])

        # Parse category
        category = ExpenseCategory.OTHER
        if data.get("category") in [c.value for c in ExpenseCategory]:
            category = ExpenseCategory(data["category"])

        # Parse total amount
        total_amount = None
        if data.get("total_amount") is not None:
            try:
                total_amount = Decimal(str(data["total_amount"]))
            except (ValueError, TypeError):
                pass

        return ParsedReceiptData(
            store_name=data.get("store_name"),
            total_amount=total_amount,
            currency=currency,
            purchase_date=purchase_date,
            category=category,
            items=items,
        )


def get_ai_parser() -> AIParser:
    return AIParser()
