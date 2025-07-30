"""
AI service for document processing and insights generation.

This module contains the AI service that uses Anthropic Claude for
expense extraction from documents and generating financial insights.
"""

import base64
import json
import logging
from typing import Any

from anthropic import Anthropic

from src.categories.service import CategoryService
from src.config import settings
from src.expenses.schemas import Expense
from src.shared.constants import Currency
from src.user_preferences.service import UserCategoryPreferenceService

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered document processing and insights."""

    def __init__(
        self,
        category_service: CategoryService | None = None,
        user_preferences_service: UserCategoryPreferenceService | None = None,
    ):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.category_service = category_service
        self.user_preferences_service = user_preferences_service

    async def _get_categories_for_prompt(self, user_id: int | None = None) -> str:
        """Get available categories for AI processing from database."""
        if self.category_service and user_id:
            try:
                # Get categories from the database (both default and user's custom categories)
                categories = await self.category_service.get_user_categories(user_id, include_default=True)
                if categories:
                    # Extract just the category names as a comma-separated list
                    category_names = [category.name for category in categories]
                    return ", ".join(category_names)
            except Exception as e:
                logger.warning(f"Failed to get database categories: {e}")

        # Fallback to default categories
        return (
            "Clothing, Education, Entertainment, Fitness, Food, Gifts, Healthcare, Home, Other, Pets, Shopping, Technology, Transport, Travel, Utilities"
        )

    async def _get_user_category_preferences_for_prompt(
        self, user_id: int | None = None
    ) -> str:
        """Get user category preferences for AI processing."""
        if self.user_preferences_service and user_id:
            try:
                # Get user category preferences from the user preferences service
                preferences_content = await self.user_preferences_service.get_user_preferences_for_ai_prompt(
                    user_id
                )
                return preferences_content
            except Exception as e:
                logger.warning(f"Failed to get user category preferences: {e}")

        return ""

    async def process_file_with_ai(
        self, file_content: bytes, file_type: str, user_id: int | None = None
    ) -> list[Expense] | None:
        """Process uploaded file (receipt/document) and extract expense information."""
        try:
            # Try processing with full document first
            expenses = await self._process_document_full(
                file_content, file_type, user_id
            )

            # If full processing fails due to size, try chunked processing
            if not expenses:
                logger.info(
                    "Full document processing failed, attempting chunked processing..."
                )
                expenses = await self._process_document_chunked(
                    file_content, file_type, user_id
                )

            return expenses

        except Exception as error:
            logger.error(f"Error processing file with AI: {error}")
            return None

    async def _process_document_full(
        self, file_content: bytes, file_type: str, user_id: int | None = None
    ) -> list[Expense] | None:
        """Process the entire document in one AI call."""
        try:
            # Convert file to base64
            base64_data = base64.b64encode(file_content).decode()

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=3000,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "document",
                                "source": {
                                    "type": "base64",
                                    "media_type": file_type,
                                    "data": base64_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": f"""Extract ALL expenses from this document. Return ONLY a JSON array with minimal fields:

                                [
                                  {{"amount":12.99,"date":"2025-01-21","merchant":"Store","category":"Groceries","description":"Milk & bread","currency":"USD"}},
                                  {{"amount":5.49,"date":"2025-01-21","merchant":"Store","category":"Groceries","description":"Fruits","currency":"USD"}}
                                ]

                                Rules:
                                - Use these categories ONLY: {await self._get_categories_for_prompt(user_id)}
                                - Use these user category preferences: {await self._get_user_category_preferences_for_prompt(user_id)}
                                - Keep descriptions under 50 characters
                                - No spaces after colons/commas in JSON
                                - Extract EVERY transaction/item as separate expense
                                - For bank statements: each transaction = one expense
                                - For receipts: group similar items if needed to stay concise
                                - IMPORTANT: Include "currency" field with detected currency code (USD, EUR, BRL)
                                - Look for currency symbols ($, €, R$) or currency codes in the document
                                - If currency is unclear, use EUR as default""",
                            },
                        ],
                    }
                ],
            )

            return self._parse_ai_response(message.content[0].text.strip())

        except Exception as error:
            logger.error(f"Error in full document processing: {error}")
            return None

    async def _process_document_chunked(
        self, file_content: bytes, file_type: str, user_id: int | None = None
    ) -> list[Expense] | None:
        """Process document in chunks for very large documents."""
        try:
            base64_data = base64.b64encode(file_content).decode()

            # First pass: Get a summary/overview
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "document",
                                "source": {
                                    "type": "base64",
                                    "media_type": file_type,
                                    "data": base64_data,
                                },
                            },
                            {
                                "type": "text",
                                "text": f"""This document is too large for full processing. Extract the FIRST 20 expenses/transactions ONLY.

                                Return JSON array (compact format):
                                [{{"amount":123.45,"date":"2025-01-21","merchant":"Name","category":"Other","description":"Brief desc","currency":"EUR"}}]

                                Categories: {await self._get_categories_for_prompt(user_id)}
                                User category preferences: {await self._get_user_category_preferences_for_prompt(user_id)}
                                Stop after 20 items maximum.""",
                            },
                        ],
                    }
                ],
            )

            first_batch = self._parse_ai_response(message.content[0].text.strip())

            if first_batch and len(first_batch) >= 20:
                logger.info(
                    f"Chunked processing: extracted first {len(first_batch)} expenses (document likely has more)"
                )
                return first_batch
            else:
                logger.info(
                    f"Chunked processing: extracted {len(first_batch) if first_batch else 0} expenses total"
                )
                return first_batch

        except Exception as error:
            logger.error(f"Error in chunked document processing: {error}")
            return None

    def _parse_ai_response(self, response_text: str) -> list[Expense] | None:
        """Parse AI response into Expense objects."""
        try:
            # More robust response cleaning
            response_text = self._clean_ai_response(response_text)

            # Parse JSON with better error handling and repair
            try:
                expenses_data = json.loads(response_text)
                logger.info(
                    f"Successfully parsed AI response with {len(expenses_data) if isinstance(expenses_data, list) else 1} expenses"
                )
            except json.JSONDecodeError as json_error:
                logger.warning(f"Initial JSON decode failed: {json_error}")
                logger.info("Attempting to repair malformed JSON...")

                # Try to repair the JSON
                repaired_json = self._repair_json(response_text)
                try:
                    expenses_data = json.loads(repaired_json)
                    logger.info(
                        f"Successfully repaired and parsed JSON with {len(expenses_data) if isinstance(expenses_data, list) else 1} expenses"
                    )
                except json.JSONDecodeError:
                    logger.error(
                        f"JSON repair failed. Raw AI response: {response_text}"
                    )
                    return None

            # Handle both single object and array responses
            if not isinstance(expenses_data, list):
                expenses_data = [expenses_data]

            # Validate and create expenses
            expenses = []
            required_fields = ["amount", "date", "merchant", "category", "description"]

            for i, expense_data in enumerate(expenses_data):
                # Validate required fields
                missing_fields = [
                    field for field in required_fields if field not in expense_data
                ]
                if missing_fields:
                    logger.error(
                        f"Expense {i + 1} missing required fields: {missing_fields}"
                    )
                    continue

                try:
                    # Detect currency from AI response or document content
                    detected_currency = expense_data.get("currency", "EUR")

                    # Validate currency and fallback to EUR if invalid
                    try:
                        currency_enum = Currency(detected_currency)
                    except ValueError:
                        logger.warning(
                            f"Invalid currency {detected_currency}, defaulting to EUR"
                        )
                        currency_enum = Currency.EUR

                    # Create expense object
                    expense = Expense(
                        id=0,  # Will be set by the API endpoint
                        amount=float(expense_data["amount"]),
                        date=expense_data["date"],
                        merchant=expense_data["merchant"],
                        category=expense_data["category"],
                        description=expense_data["description"],
                        items=expense_data.get("items", []),
                        type="expense",
                        source="ai-processed",
                        original_currency=currency_enum.value,
                    )
                    expenses.append(expense)
                    logger.info(
                        f"Created expense {i + 1}: {expense.description} - {expense.amount}"
                    )

                except (ValueError, TypeError) as e:
                    logger.error(f"Error creating expense {i + 1}: {e}")
                    continue

            if not expenses:
                logger.error("No valid expenses could be created from AI response")
                return None

            logger.info(f"Successfully created {len(expenses)} expenses from document")
            return expenses

        except Exception as error:
            logger.error(f"Error parsing AI response: {error}")
            return None

    def _clean_ai_response(self, response_text: str) -> str:
        """Clean AI response to extract valid JSON (object or array)."""
        # Remove markdown code blocks
        response_text = response_text.replace("```json", "").replace("```", "")

        # Remove common prefixes/suffixes
        response_text = response_text.replace("Here's the extracted data:", "")
        response_text = response_text.replace("The extracted information is:", "")
        response_text = response_text.replace("Here are the expenses:", "")

        # Find JSON boundaries (either array or object)
        array_start = response_text.find("[")
        object_start = response_text.find("{")

        # Prefer array format if both are present
        if array_start != -1 and (object_start == -1 or array_start < object_start):
            # Handle JSON array
            start_idx = array_start
            end_idx = response_text.rfind("]") + 1
        elif object_start != -1:
            # Handle JSON object
            start_idx = object_start
            end_idx = response_text.rfind("}") + 1
        else:
            # No JSON found, return as is
            return response_text.strip()

        if start_idx != -1 and end_idx != -1:
            response_text = response_text[start_idx:end_idx]

        return response_text.strip()

    def _repair_json(self, json_text: str) -> str:
        """Attempt to repair common JSON formatting issues."""
        json_text = json_text.strip()

        # Remove any trailing incomplete text after the last complete object
        if json_text.startswith("["):
            # Find the last complete object in the array
            last_complete_end = -1
            brace_count = 0
            in_string = False
            escape_next = False

            for i, char in enumerate(json_text):
                if escape_next:
                    escape_next = False
                    continue

                if char == "\\":
                    escape_next = True
                    continue

                if char == '"' and not escape_next:
                    in_string = not in_string
                    continue

                if not in_string:
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            last_complete_end = i

            # If we found complete objects, truncate after the last one
            if last_complete_end > 0:
                json_text = json_text[: last_complete_end + 1]

                # Add closing bracket if needed
                if not json_text.endswith("]"):
                    json_text += "]"

        # If it's a truncated array, try to fix it
        elif json_text.startswith("[") and not json_text.endswith("]"):
            # Count open and close braces to see if we need to close objects
            open_braces = json_text.count("{")
            close_braces = json_text.count("}")

            # Add missing closing braces for objects
            missing_braces = open_braces - close_braces
            for _ in range(missing_braces):
                json_text += "}"

            # Add missing closing bracket for array
            if not json_text.endswith("]"):
                json_text += "]"

        # If it's a truncated object, try to fix it
        elif json_text.startswith("{") and not json_text.endswith("}"):
            json_text += "}"

        # Remove trailing commas before closing brackets/braces
        json_text = json_text.replace(",]", "]").replace(",}", "}")

        # Fix common quote and encoding issues
        json_text = json_text.replace('""', '"').replace(",,", ",")

        return json_text

    async def categorize_transaction(
        self, transaction: dict[str, Any], user_id: int | None = None
    ) -> str:
        """Intelligently categorize a transaction using AI and user preferences."""
        try:
            # Extract transaction details
            description = transaction.get("description", "")
            merchant = transaction.get("merchant", "")
            belvo_category = transaction.get("category", "")
            belvo_subcategory = transaction.get("subcategory", "")
            amount = transaction.get("amount", 0)

            # Get available categories and user preferences
            categories = await self._get_categories_for_prompt(user_id)
            user_preferences = await self._get_user_category_preferences_for_prompt(
                user_id
            )

            # Build the AI prompt for categorization
            prompt = f"""Categorize this financial transaction intelligently.
                Transaction Details:
                - Description: {description}
                - Merchant: {merchant}
                - Amount: {amount}
                - Belvo Category: {belvo_category}
                - Belvo Subcategory: {belvo_subcategory}

                Available Categories: {categories}

                User Category Preferences (learn from these patterns): 
                {user_preferences}

                Rules:
                1. ONLY return the category name from the available categories list
                2. Consider the user's historical preferences for similar merchants/descriptions
                3. Use context clues from description, merchant name, and amount
                4. If Belvo category provides good context, consider it but prioritize user preferences
                5. For unclear transactions, use "Other" as fallback
                6. Return ONLY the category name, no explanation

                Category:
            """

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=50,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            # Extract and clean the response
            category = message.content[0].text.strip().lower()

            # Validate the category exists in our available categories
            available_categories = [
                cat.strip().lower() for cat in categories.split(",")
            ]

            if category in available_categories:
                # Return the properly formatted category name
                category_index = available_categories.index(category)
                proper_category = categories.split(",")[category_index].strip()
                logger.info(
                    f"AI categorized transaction '{description}' as '{proper_category}'"
                )
                return proper_category
            else:
                # Fallback to "Other" if AI returned invalid category
                logger.warning(
                    f"AI returned invalid category '{category}', using 'Other'"
                )
                return "Other"

        except Exception as error:
            logger.error(f"Error in AI transaction categorization: {error}")
            # Fallback to simple rule-based categorization
            return self._fallback_categorization(transaction)

    def _fallback_categorization(self, transaction: dict[str, Any]) -> str:
        """Fallback rule-based categorization when AI fails."""
        description = (transaction.get("description") or "").lower()
        belvo_category = (transaction.get("category") or "").lower()

        # Simple keyword-based categorization
        if any(
            word in description
            for word in ["food", "restaurant", "cafe", "pizza", "delivery"]
        ):
            return "Food"
        elif any(
            word in description for word in ["gas", "fuel", "uber", "taxi", "transport"]
        ):
            return "Transport"
        elif any(
            word in description for word in ["pharmacy", "hospital", "clinic", "doctor"]
        ):
            return "Healthcare"
        elif any(word in description for word in ["shop", "store", "market", "retail"]):
            return "Shopping"
        elif "entertainment" in belvo_category or "leisure" in belvo_category:
            return "Entertainment"
        elif "utility" in belvo_category or "bill" in description:
            return "Utilities"
        else:
            return "Other"

    async def generate_insights(self, expenses, budgets_dict) -> list:
        """Generate AI insights based on expenses and budgets.

        Note: This is a placeholder method. Full implementation would analyze
        expenses and budgets to generate meaningful financial insights.
        """
        logger.info(
            "generate_insights called - returning empty list (method not implemented)"
        )
        return []


# Note: AIService instances should be created with category_service dependency
# No global instance to ensure proper dependency injection
