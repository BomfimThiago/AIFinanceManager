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
            "total_price": 0.00,
            "category": "category_key"
        }
    ]
}

Available categories for items:
- groceries: Food items, beverages, household consumables
- dining: Restaurant meals, takeout, coffee shops
- transportation: Gas, parking, public transit, ride-sharing
- utilities: Water, gas, electricity bills
- entertainment: Movies, games, streaming, events
- healthcare: Medicine, pharmacy, medical services
- shopping: Clothing, electronics, general retail
- housing: Home repairs, furniture, home goods
- education: Books, courses, school supplies
- travel: Hotels, flights, vacation expenses
- rent: Rent payments
- energy: Electricity, gas bills specifically
- internet: Internet, phone bills
- insurance: Insurance payments
- subscriptions: Recurring subscriptions (Netflix, Spotify, etc.)
- other_expense: Anything that doesn't fit above categories

Rules:
- If a field cannot be determined, use null
- Currency should be inferred from symbols or text ($ = USD, € = EUR, R$ = BRL, £ = GBP)
- The receipt-level "category" should be the most common category among items
- Each item MUST have its own "category" based on what the item is
- For items, extract as many as you can identify
- All prices should be numbers, not strings
- Be specific with item categories: bread -> groceries, beer -> groceries, steak dinner -> dining

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
        # Valid category keys derived from enum
        valid_categories = {c.value for c in ExpenseCategory}

        items = []
        for item in data.get("items", []):
            try:
                # Get item category, default to OTHER_EXPENSE if invalid
                item_category_str = item.get("category", "other_expense")
                if item_category_str not in valid_categories:
                    item_category = ExpenseCategory.OTHER_EXPENSE
                else:
                    item_category = ExpenseCategory(item_category_str)

                items.append(
                    ParsedItemData(
                        name=item.get("name", "Unknown"),
                        quantity=Decimal(str(item.get("quantity", 1))),
                        unit_price=Decimal(str(item.get("unit_price", 0))),
                        total_price=Decimal(str(item.get("total_price", 0))),
                        category=item_category,
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
