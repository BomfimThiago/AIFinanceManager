import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

from anthropic import Anthropic

from src.config import get_settings
from src.receipts.schemas import ParsedItemData, ParsedReceiptData
from src.shared.constants import Currency, ExpenseCategory

settings = get_settings()
logger = logging.getLogger(__name__)


@dataclass
class UserCategoryContext:
    """Context for personalizing AI classification.

    Attributes:
        custom_categories: List of user's custom categories with keys and names
        learned_mappings: List of item->category learned preferences
    """

    custom_categories: list[dict] = field(default_factory=list)
    learned_mappings: list[dict] = field(default_factory=list)


# Default categories with descriptions
DEFAULT_CATEGORIES = {
    "groceries": "Food items, beverages, household consumables",
    "dining": "Restaurant meals, takeout, coffee shops",
    "transportation": "Gas, parking, public transit, ride-sharing",
    "utilities": "Water, gas, electricity bills",
    "entertainment": "Movies, games, streaming, events",
    "healthcare": "Medicine, pharmacy, medical services",
    "shopping": "Clothing, electronics, general retail",
    "housing": "Home repairs, furniture, home goods",
    "education": "Books, courses, school supplies",
    "travel": "Hotels, flights, vacation expenses",
    "rent": "Rent payments",
    "energy": "Electricity, gas bills specifically",
    "internet": "Internet, phone bills",
    "insurance": "Insurance payments",
    "subscriptions": "Recurring subscriptions (Netflix, Spotify, etc.)",
    "other_expense": "Anything that doesn't fit above categories",
}


def build_dynamic_prompt(user_context: UserCategoryContext | None = None) -> str:
    """Build a personalized prompt based on user preferences.

    Args:
        user_context: Optional user-specific context with custom categories
                     and learned preferences

    Returns:
        A complete prompt string for the AI
    """
    base_prompt = """Analyze this receipt text and extract the following information in JSON format:

{
    "store_name": "Name of the store/merchant",
    "total_amount": 0.00,
    "currency": "USD|EUR|BRL|GBP",
    "purchase_date": "YYYY-MM-DD",
    "category": "category_key",
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

"""

    # Build categories section
    categories_section = _build_categories_section(user_context)

    # Build learned preferences section
    preferences_section = _build_preferences_section(user_context)

    rules_section = """
Rules:
- If a field cannot be determined, use null
- Currency should be inferred from symbols or text ($ = USD, € = EUR, R$ = BRL, £ = GBP)
- The receipt-level "category" should be the most common category among items
- Each item MUST have its own "category" based on what the item is
- For items, extract as many as you can identify
- All prices should be numbers, not strings
- Be specific with item categories: bread -> groceries, beer -> groceries
- IMPORTANT: Use the user's learned preferences for item categorization when applicable
- IMPORTANT: Prefer user's custom categories over default categories when both could apply

Receipt text:
"""

    return base_prompt + categories_section + preferences_section + rules_section


def _build_categories_section(user_context: UserCategoryContext | None) -> str:
    """Build the available categories section with user customizations."""
    section = "\nAvailable categories:\n"

    # Add user's custom categories first (higher priority)
    if user_context and user_context.custom_categories:
        section += "\n=== USER'S CUSTOM CATEGORIES (PREFER THESE) ===\n"
        for cat in user_context.custom_categories:
            section += f"- {cat['key']}: {cat['name']} (Custom category created by user)\n"
        section += "\n=== DEFAULT CATEGORIES ===\n"

    # Add default categories
    for key, description in DEFAULT_CATEGORIES.items():
        section += f"- {key}: {description}\n"

    return section


def _build_preferences_section(user_context: UserCategoryContext | None) -> str:
    """Build the learned preferences section."""
    if not user_context or not user_context.learned_mappings:
        return ""

    section = """
=== USER'S LEARNED PREFERENCES (FOLLOW THESE FOR MATCHING ITEMS) ===
The user has previously corrected these item classifications. Apply these mappings:
"""

    for mapping in user_context.learned_mappings:
        item = mapping["item_name"]
        category = mapping["target_category"]
        store = mapping.get("store_name")
        confidence = mapping.get("confidence", 1.0)

        if store:
            section += f'- "{item}" at "{store}" -> {category} (confidence: {confidence:.1f})\n'
        else:
            section += f'- "{item}" -> {category} (confidence: {confidence:.1f})\n'

    section += "\nNote: Higher confidence means the user has reinforced this "
    section += "preference multiple times.\n"

    return section


class AIParser:
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)

    async def parse_receipt(
        self,
        ocr_text: str,
        user_context: UserCategoryContext | None = None,
    ) -> ParsedReceiptData:
        """Parse receipt text with optional user-specific context.

        Args:
            ocr_text: The OCR-extracted text from the receipt
            user_context: Optional user preferences for personalized classification

        Returns:
            ParsedReceiptData with extracted information
        """
        try:
            # Build dynamic prompt based on user context
            prompt = build_dynamic_prompt(user_context)

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                messages=[
                    {
                        "role": "user",
                        "content": f"{prompt}\n{ocr_text}",
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

            return self._parse_response(data, user_context)

        except Exception as e:
            logger.error(f"AI parsing error: {e}")
            return ParsedReceiptData()

    def _parse_response(
        self,
        data: dict,
        user_context: UserCategoryContext | None = None,
    ) -> ParsedReceiptData:
        """Parse and validate AI response.

        Args:
            data: The parsed JSON from AI response
            user_context: User context for validating custom categories

        Returns:
            ParsedReceiptData with validated fields
        """
        # Build valid categories set (defaults + user custom)
        valid_categories = {c.value for c in ExpenseCategory}

        if user_context and user_context.custom_categories:
            for cat in user_context.custom_categories:
                valid_categories.add(cat["key"])

        items = []
        for item in data.get("items", []):
            try:
                # Get item category, default to other_expense if invalid
                item_category = item.get("category", "other_expense")
                if item_category not in valid_categories:
                    item_category = "other_expense"

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

        # Parse category (supports custom categories)
        category = data.get("category", "other")
        if category not in valid_categories:
            category = "other"

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
