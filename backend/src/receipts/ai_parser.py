import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

import dateparser
from anthropic import Anthropic

from src.config import get_settings
from src.receipts.schemas import ParsedItemData, ParsedReceiptData
from src.shared.constants import Currency, ExpenseCategory

settings = get_settings()
logger = logging.getLogger(__name__)


def repair_json(json_str: str) -> str:
    """Attempt to repair common JSON issues.

    Fixes:
    - Trailing commas before ] or }
    - Missing quotes around keys
    - Single quotes instead of double quotes
    """
    # Remove trailing commas before ] or }
    json_str = re.sub(r',\s*([}\]])', r'\1', json_str)

    # Replace single quotes with double quotes (careful with apostrophes in values)
    # Only replace if it looks like a JSON structure
    if "'" in json_str and '"' not in json_str:
        json_str = json_str.replace("'", '"')

    return json_str


def extract_json_from_text(text: str) -> str | None:
    """Extract JSON object from text, handling nested structures properly.

    Args:
        text: Text that may contain a JSON object

    Returns:
        The extracted JSON string, or None if not found
    """
    # Find the first { and track bracket depth
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False
    end = start

    for i, char in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue

        if char == '\\':
            escape_next = True
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
            continue

        if in_string:
            continue

        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    if depth != 0:
        # JSON is incomplete, try to find the last valid }
        # and attempt repair
        last_brace = text.rfind("}")
        if last_brace > start:
            end = last_brace + 1

    return text[start:end]


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
    base_prompt = """Analyze this receipt/document text and extract the following information in JSON format.

IMPORTANT: This document may be in ANY LANGUAGE (English, Spanish, Portuguese, etc.).
Detect the language and look for date patterns accordingly:

- English: "Date", "Transaction date", "Jan/Feb/Mar", etc.
- Spanish: "Fecha", "Fecha de transacción", "ene/feb/mar", "17 dic 2025"
- Portuguese: "Data", "Data da transação", "JAN/FEV/MAR", "02 JAN 2026"

For bank statements, EXTRACT EACH TRANSACTION as a separate item with its date.

{
    "store_name": "Name of the store/merchant/bank",
    "total_amount": 0.00,
    "currency": "USD|EUR|BRL|GBP",
    "purchase_date": "YYYY-MM-DD",
    "category": "category_key",
    "items": [
        {
            "name": "Item/transaction description",
            "quantity": 1,
            "unit_price": 0.00,
            "total_price": 0.00,
            "category": "category_key",
            "transaction_date": "YYYY-MM-DD (if different from main date)"
        }
    ]
}

CRITICAL DATE EXTRACTION RULES:
1. ALWAYS extract dates, regardless of language
2. Common date patterns to look for:
   - "17 dic 2025" (Spanish) → 2025-12-17
   - "02 JAN 2026" (Portuguese) → 2026-01-02
   - "Fecha: XX/XX/XXXX" → convert to YYYY-MM-DD
   - "Data: XX/XX/XXXX" → convert to YYYY-MM-DD
3. For bank statements: use the transaction date for EACH item
4. Convert ALL dates to YYYY-MM-DD format
5. NEVER leave purchase_date as null if dates are visible

"""

    # Build categories section
    categories_section = _build_categories_section(user_context)

    # Build learned preferences section
    preferences_section = _build_preferences_section(user_context)

    rules_section = """
Rules:
- LANGUAGE AWARENESS: Detect and work with ANY language (Spanish, Portuguese, English, etc.)
- If a field cannot be determined, use null EXCEPT for dates - always try to extract dates
- Currency should be inferred from symbols or text ($ = USD, € = EUR, R$ = BRL, £ = GBP)
- For bank statements: Each transaction is an "item" with its own date and amount
- The receipt-level "category" should be the most common category among items
- Each item MUST have its own "category" based on what the item is
- For items, extract as many as you can identify
- All prices should be numbers, not strings
- Be specific with item categories: bread -> groceries, beer -> groceries, Pix transfer -> other
- IMPORTANT: Use the user's learned preferences for item categorization when applicable
- IMPORTANT: Prefer user's custom categories over default categories when both could apply
- CRITICAL: Extract dates from ANY language - "17 dic 2025", "02 JAN 2026", etc.

Receipt/Document text:
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
            logger.info(f"Starting AI parsing - OCR text length: {len(ocr_text)}")
            logger.debug(f"First 500 chars of OCR text: {ocr_text[:500]}")

            # Check if document needs chunked processing
            chunk_threshold = 8000  # Characters threshold for chunking
            is_bank_statement = self._is_bank_statement(ocr_text)

            if len(ocr_text) > chunk_threshold or is_bank_statement:
                logger.info(f"Processing large document in chunks (length: {len(ocr_text)}, is_statement: {is_bank_statement})")
                return await self._parse_in_chunks(ocr_text, user_context, is_bank_statement)

            # Regular processing for small documents
            result = await self._parse_single(ocr_text, user_context, is_bank_statement=False)

            # Log if parsing failed to extract basic info
            if not result.store_name and not result.total_amount:
                logger.warning("AI failed to extract store name and total amount from receipt")
                logger.debug(f"OCR text that failed parsing: {ocr_text[:1000]}")
            else:
                logger.info(f"Successfully parsed receipt - Store: {result.store_name}, Total: {result.total_amount}, Date: {result.purchase_date}")

            return result

        except Exception as e:
            logger.error(f"AI parsing error: {e}", exc_info=True)
            return ParsedReceiptData()

    async def _parse_single(
        self,
        ocr_text: str,
        user_context: UserCategoryContext | None,
        is_bank_statement: bool = False,
        is_chunk: bool = False,
    ) -> ParsedReceiptData:
        """Parse a single chunk or small document."""
        prompt = build_dynamic_prompt(user_context)

        if is_bank_statement or is_chunk:
            prompt += "\n\nIMPORTANT: Extract ALL transactions as separate items. "
            prompt += "Each item should have: name (merchant/description), amount (total_price), date, and category. "
            prompt += "For expenses, use positive amounts. "

        logger.info("Sending request to AI for parsing...")

        # Retry logic for overloaded errors
        max_retries = 3
        retry_delay = 1  # Start with 1 second

        for attempt in range(max_retries):
            try:
                message = self.client.messages.create(
                    model="claude-opus-4-5-20251101",  # Claude Opus 4.5 - Maximum intelligence for complex parsing
                    max_tokens=4096,
                    messages=[
                        {
                            "role": "user",
                            "content": f"{prompt}\n{ocr_text}",
                        }
                    ],
                )
                break  # Success, exit retry loop
            except Exception as e:
                if "overloaded" in str(e).lower() or "529" in str(e):
                    if attempt < max_retries - 1:
                        logger.warning(f"API overloaded, retrying in {retry_delay} seconds... (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        # Try fallback to Sonnet if Opus is overloaded
                        logger.warning("Opus overloaded, falling back to Sonnet 4.5...")
                        try:
                            message = self.client.messages.create(
                                model="claude-sonnet-4-5-20250929",  # Fallback to Sonnet
                                max_tokens=4096,
                                messages=[
                                    {
                                        "role": "user",
                                        "content": f"{prompt}\n{ocr_text}",
                                    }
                                ],
                            )
                            break
                        except:
                            logger.error("Both Opus and Sonnet are overloaded")
                            raise
                else:
                    raise  # Re-raise if not an overload error

        response_text = message.content[0].text
        logger.debug(f"AI response (first 500 chars): {response_text[:500]}")

        # Extract and parse JSON
        json_str = extract_json_from_text(response_text)
        if not json_str:
            logger.error(f"No JSON found in AI response. Full response: {response_text}")
            return ParsedReceiptData()

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse failed, attempting repair: {e}")
            repaired = repair_json(json_str)
            try:
                data = json.loads(repaired)
            except json.JSONDecodeError as e2:
                logger.error(f"JSON repair failed: {e2}")
                data = self._extract_partial_data(json_str)
                if not data:
                    return ParsedReceiptData()

        return self._parse_response(data, user_context)

    async def _parse_in_chunks(
        self,
        ocr_text: str,
        user_context: UserCategoryContext | None,
        is_bank_statement: bool,
    ) -> ParsedReceiptData:
        """Process large documents in chunks and aggregate results."""
        chunks = self._split_into_chunks(ocr_text)
        logger.info(f"Split document into {len(chunks)} chunks")

        all_items: list[ParsedItemData] = []
        store_name = None
        currency = Currency.USD
        purchase_date = None
        category = "other"

        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i + 1}/{len(chunks)} (length: {len(chunk)})")
            try:
                result = await self._parse_single(
                    chunk,
                    user_context,
                    is_bank_statement=is_bank_statement,
                    is_chunk=True,
                )

                # Aggregate items
                all_items.extend(result.items)

                # Use first valid values for metadata
                if not store_name and result.store_name:
                    store_name = result.store_name
                if result.currency != Currency.USD:
                    currency = result.currency
                if not purchase_date and result.purchase_date:
                    purchase_date = result.purchase_date
                if result.category and result.category != "other":
                    category = result.category

            except Exception as e:
                logger.error(f"Error processing chunk {i + 1}: {e}")
                continue

        # Calculate total from all items
        total_amount = None
        if all_items:
            total = sum(item.total_price for item in all_items)
            if total > 0:
                total_amount = total

        logger.info(f"Aggregated {len(all_items)} items from chunks, total: {total_amount}")

        return ParsedReceiptData(
            store_name=store_name,
            total_amount=total_amount,
            currency=currency,
            purchase_date=purchase_date,
            category=category,
            items=all_items,
        )

    def _split_into_chunks(self, text: str, max_chunk_size: int = 6000) -> list[str]:
        """Split text into chunks, preferring page boundaries.

        Args:
            text: The full OCR text
            max_chunk_size: Maximum characters per chunk

        Returns:
            List of text chunks
        """
        # Try to split by page markers first
        page_markers = ["--- Page", "---Page", "Page ", "Página ", "Pagina "]
        pages = []

        for marker in page_markers:
            if marker in text:
                # Split by this marker
                parts = text.split(marker)
                if len(parts) > 1:
                    pages = [parts[0]] if parts[0].strip() else []
                    for part in parts[1:]:
                        pages.append(marker + part)
                    break

        # If no page markers found, split by size
        if not pages:
            pages = [text]

        # Now ensure each chunk is within size limit
        chunks = []
        current_chunk = ""

        for page in pages:
            if len(current_chunk) + len(page) <= max_chunk_size:
                current_chunk += page
            else:
                if current_chunk:
                    chunks.append(current_chunk)

                # If single page is too large, split it further
                if len(page) > max_chunk_size:
                    # Split by paragraphs or lines
                    lines = page.split("\n")
                    current_chunk = ""
                    for line in lines:
                        if len(current_chunk) + len(line) + 1 <= max_chunk_size:
                            current_chunk += line + "\n"
                        else:
                            if current_chunk:
                                chunks.append(current_chunk)
                            current_chunk = line + "\n"
                else:
                    current_chunk = page

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _is_bank_statement(self, text: str) -> bool:
        """Detect if the text is from a bank statement."""
        indicators = [
            # Spanish
            "extracto",
            "fecha de transacción",
            "fecha valor",
            "dinero saliente",
            "dinero entrante",
            "saldo",
            "cuenta",
            "transferencia",
            # Portuguese
            "extrato",
            "movimentações",
            "transferência",
            "pix",
            "total de entradas",
            "total de saídas",
            # English
            "statement",
            "bank",
            "account",
            "balance",
            "transactions",
            # Bank names
            "revolut",
            "nubank",
            "banco",
        ]
        text_lower = text.lower()[:2000]  # Check first 2000 chars
        matches = sum(1 for ind in indicators if ind in text_lower)
        return matches >= 2

    def _extract_partial_data(self, json_str: str) -> dict | None:
        """Try to extract partial data from malformed JSON."""
        data = {}

        # Try to extract store_name
        store_match = re.search(r'"store_name"\s*:\s*"([^"]*)"', json_str)
        if store_match:
            data["store_name"] = store_match.group(1)

        # Try to extract total_amount
        amount_match = re.search(r'"total_amount"\s*:\s*([\d.]+)', json_str)
        if amount_match:
            try:
                data["total_amount"] = float(amount_match.group(1))
            except ValueError:
                pass

        # Try to extract currency
        currency_match = re.search(r'"currency"\s*:\s*"([A-Z]{3})"', json_str)
        if currency_match:
            data["currency"] = currency_match.group(1)

        # Try to extract purchase_date (multiple formats)
        date_patterns = [
            r'"purchase_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"',  # YYYY-MM-DD
            r'"purchase_date"\s*:\s*"(\d{2}/\d{2}/\d{4})"',  # DD/MM/YYYY or MM/DD/YYYY
            r'"purchase_date"\s*:\s*"(\d{2}-\d{2}-\d{4})"',  # DD-MM-YYYY or MM-DD-YYYY
            r'"purchase_date"\s*:\s*"([^"]*\d{4}[^"]*)"',    # Any format with year
        ]

        for pattern in date_patterns:
            date_match = re.search(pattern, json_str)
            if date_match:
                data["purchase_date"] = date_match.group(1)
                break

        # Try to extract category
        cat_match = re.search(r'"category"\s*:\s*"([^"]*)"', json_str)
        if cat_match:
            data["category"] = cat_match.group(1)

        if data:
            logger.info(f"Extracted partial data: {list(data.keys())}")
            return data

        return None

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

                # Parse transaction date if present (for bank statements)
                item_date = None
                if item.get("transaction_date"):
                    item_date_parsed = dateparser.parse(
                        item["transaction_date"],
                        languages=['en', 'es', 'pt'],
                        settings={
                            'STRICT_PARSING': False,
                            'RETURN_AS_TIMEZONE_AWARE': False,
                        }
                    )
                    if item_date_parsed:
                        item_date = item_date_parsed
                        logger.debug(f"Parsed item date '{item['transaction_date']}' -> {item_date}")

                items.append(
                    ParsedItemData(
                        name=item.get("name", "Unknown"),
                        quantity=Decimal(str(item.get("quantity", 1))),
                        unit_price=Decimal(str(item.get("unit_price", 0))),
                        total_price=Decimal(str(item.get("total_price", 0))),
                        category=item_category,
                        transaction_date=item_date,
                    )
                )
            except (ValueError, TypeError):
                continue

        # Parse date using dateparser library (handles multiple languages automatically)
        purchase_date = None
        if data.get("purchase_date"):
            date_str = data["purchase_date"]

            # Try dateparser first - it handles multiple languages and formats
            parsed_date = dateparser.parse(
                date_str,
                languages=['en', 'es', 'pt'],  # English, Spanish, Portuguese
                date_formats=[
                    "%Y-%m-%d",      # 2024-12-25
                    "%d/%m/%Y",      # 25/12/2024
                    "%m/%d/%Y",      # 12/25/2024
                    "%d-%m-%Y",      # 25-12-2024
                    "%d.%m.%Y",      # 25.12.2024
                    "%d %b %Y",      # 17 dic 2025, 02 JAN 2026
                    "%d %B %Y",      # 17 diciembre 2025
                ],
                settings={
                    'STRICT_PARSING': False,  # Be flexible with formats
                    'PREFER_DAY_OF_MONTH': 'first',  # For ambiguous dates
                    'RETURN_AS_TIMEZONE_AWARE': False,
                }
            )

            if parsed_date:
                purchase_date = parsed_date
                logger.info(f"Successfully parsed date '{date_str}' -> {purchase_date}")
            else:
                # Fallback to standard parsing if dateparser fails
                try:
                    purchase_date = datetime.strptime(date_str, "%Y-%m-%d")
                except ValueError:
                    logger.warning(f"Could not parse date: {date_str}")
        else:
            logger.warning("No purchase_date found in AI response - will use current date as fallback")

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
