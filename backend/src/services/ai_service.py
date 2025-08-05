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

    def _is_complex_document(self, file_content: bytes, file_type: str) -> bool:
        """
        Determine if a document is complex and requires advanced AI processing.

        Complex documents: PDFs, large files, handwritten receipts
        Simple documents: Small images, structured digital receipts
        """
        # File size threshold (500KB)
        if len(file_content) > 500 * 1024:
            return True

        # PDF files are generally more complex
        if "pdf" in file_type.lower():
            return True

        # For now, assume images under 500KB are simple
        # In the future, could add image analysis for handwriting detection
        return False

    async def process_file_with_ai(
        self, file_content: bytes, file_type: str, user_id: int | None = None
    ) -> list[Expense] | None:
        """Process uploaded file (receipt/document) and extract expense information."""
        try:
            # Determine document complexity to optimize model selection
            is_complex_document = self._is_complex_document(file_content, file_type)

            # Try processing with appropriate model based on complexity
            if is_complex_document:
                logger.info("Processing complex document with Sonnet model")
                expenses = await self._process_document_full(
                    file_content, file_type, user_id, use_advanced_model=True
                )
            else:
                logger.info("Processing simple document with Haiku model")
                expenses = await self._process_document_full(
                    file_content, file_type, user_id, use_advanced_model=False
                )

            # If processing fails, try with advanced model as fallback
            if not expenses and not is_complex_document:
                logger.info("Simple model failed, falling back to advanced model...")
                expenses = await self._process_document_full(
                    file_content, file_type, user_id, use_advanced_model=True
                )

            # If still no results, try chunked processing
            if not expenses:
                logger.info("Full document processing failed, attempting chunked processing...")
                expenses = await self._process_document_chunked(
                    file_content, file_type, user_id
                )

            return expenses

        except Exception as error:
            logger.error(f"Error processing file with AI: {error}")
            return None

    async def _process_document_full(
        self, file_content: bytes, file_type: str, user_id: int | None = None, use_advanced_model: bool = True
    ) -> list[Expense] | None:
        """Process the entire document in one AI call."""
        try:
            # Convert file to base64
            base64_data = base64.b64encode(file_content).decode()

            # Select model based on document complexity
            model = "claude-sonnet-4-20250514" if use_advanced_model else "claude-3-5-haiku-20241022"
            logger.info(f"Processing document with model: {model}")

            message = self.client.messages.create(
                model=model,
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
                                - If currency is unclear, use EUR as default
                                - IMPORTANT: Include "type" field as "expense" or "income" based on transaction nature
                                - Income categories include: Salary, Pix, Bank Transfer, Investment, Bonus, Freelance, Business, Rental, Gift, Other Income
                                - If detecting income (deposits, transfers in, salary, etc.), use appropriate income category""",
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
                    # Determine transaction type based on category
                    transaction_type = expense_data.get("type", "expense")
                    if expense_data["category"] in ["Salary", "Pix", "Bank Transfer", "Investment", "Bonus", "Freelance", "Business", "Rental", "Gift", "Other Income"]:
                        transaction_type = "income"

                    expense = Expense(
                        id=0,  # Will be set by the API endpoint
                        amount=float(expense_data["amount"]),
                        date=expense_data["date"],
                        merchant=expense_data["merchant"],
                        category=expense_data["category"],
                        description=expense_data["description"],
                        items=expense_data.get("items", []),
                        type=transaction_type,
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
                model="claude-3-5-haiku-20241022",  # Optimized: Use cheaper model for simple categorization
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
        """Generate comprehensive AI insights based on expenses and budgets using Haiku model."""
        try:
            from collections import defaultdict
            from datetime import datetime

            # Prepare expense data for analysis
            logger.info(f"🔍 Starting insights generation - Expenses count: {len(expenses) if expenses else 0}")
            logger.info(f"🔍 Budgets dict: {budgets_dict}")

            if not expenses:
                logger.info("No expenses to analyze - returning onboarding insights")
                # Return helpful onboarding insights when no data exists
                from src.insights.schemas import AIInsight
                return [
                    AIInsight(
                        title="Welcome to Your Finance Dashboard!",
                        message="Start by uploading receipts or adding expenses manually to begin tracking your finances.",
                        type="info",
                        actionable="Click the 'Upload' tab to add your first receipt, or go to 'Expenses' to add transactions manually."
                    ),
                    AIInsight(
                        title="Set Up Your First Budget",
                        message="Creating budgets helps you control spending and reach your financial goals.",
                        type="info",
                        actionable="Navigate to the 'Budgets' tab to set spending limits for different categories."
                    ),
                    AIInsight(
                        title="Track Different Currencies",
                        message="This app supports multiple currencies (USD, EUR, BRL) with automatic conversion.",
                        type="info",
                        actionable="Use the currency selector in the top navigation to switch between currencies."
                    )
                ]

            # Group expenses by month and category
            monthly_data = defaultdict(lambda: {"income": 0, "expenses": 0, "by_category": defaultdict(float)})
            category_totals = defaultdict(float)
            merchant_frequency = defaultdict(int)

            for expense in expenses:
                # Parse date
                expense_date = datetime.fromisoformat(expense.date)
                month_key = f"{expense_date.year}-{expense_date.month:02d}"

                if expense.type == "income":
                    monthly_data[month_key]["income"] += expense.amount
                else:
                    monthly_data[month_key]["expenses"] += expense.amount
                    monthly_data[month_key]["by_category"][expense.category] += expense.amount
                    category_totals[expense.category] += expense.amount
                    if expense.merchant:
                        merchant_frequency[expense.merchant] += 1

            # Calculate insights data
            sorted_months = sorted(monthly_data.keys())
            latest_month = sorted_months[-1] if sorted_months else None

            # Find highest and lowest spending months
            highest_spending_month = max(monthly_data.items(), key=lambda x: x[1]["expenses"]) if monthly_data else None
            lowest_spending_month = min(monthly_data.items(), key=lambda x: x[1]["expenses"]) if monthly_data else None

            # Get top spending categories
            sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
            top_categories = sorted_categories[:5] if sorted_categories else []

            # Get most frequent merchants
            sorted_merchants = sorted(merchant_frequency.items(), key=lambda x: x[1], reverse=True)
            top_merchants = sorted_merchants[:5] if sorted_merchants else []

            # Format spending month data
            highest_month_str = "N/A"
            highest_amount_str = "$0.00"
            if highest_spending_month:
                highest_month_str = highest_spending_month[0]
                highest_amount_str = f"${highest_spending_month[1]['expenses']:.2f}"

            lowest_month_str = "N/A"
            lowest_amount_str = "$0.00"
            if lowest_spending_month:
                lowest_month_str = lowest_spending_month[0]
                lowest_amount_str = f"${lowest_spending_month[1]['expenses']:.2f}"

            # Prepare the AI prompt
            analysis_prompt = f"""Analyze this financial data and provide comprehensive insights:

MONTHLY OVERVIEW:
{self._format_monthly_data(monthly_data, sorted_months)}

CATEGORY BREAKDOWN (Total spending by category):
{self._format_category_data(top_categories, category_totals)}

TOP MERCHANTS (by frequency):
{self._format_merchant_data(top_merchants)}

BUDGET ANALYSIS:
{self._format_budget_data(budgets_dict, monthly_data[latest_month]["by_category"] if latest_month else {})}

HIGHEST SPENDING MONTH: {highest_month_str} - {highest_amount_str}
LOWEST SPENDING MONTH: {lowest_month_str} - {lowest_amount_str}

Generate 4-6 personalized financial insights. For each insight, provide:
1. A brief title (max 50 chars)
2. A detailed message explaining the insight (2-3 sentences)
3. A specific actionable recommendation
4. Type: "warning" (overspending/issues), "success" (good patterns), or "info" (neutral observations)

Focus on:
- Spending patterns and trends across months
- Category analysis (what they're spending most on)
- Budget alignment (are they meeting their goals?)
- Income vs expenses balance
- Savings opportunities
- Unusual spending patterns
- Recommendations for financial improvement

Return ONLY a JSON array with this format:
[
  {{
    "title": "High Food Spending Detected",
    "message": "Your food expenses have increased 35% over the last 3 months. This category now represents 40% of your total spending.",
    "actionable": "Consider meal planning and cooking at home more often. Set a weekly food budget of $150 to reduce spending by 20%.",
    "type": "warning"
  }}
]

Be specific with numbers and percentages. Make insights actionable and personalized based on the actual data."""

            # Call AI with Haiku model for cost-effective analysis
            logger.info("🤖 Calling AI with analysis prompt")
            logger.info(f"📝 Prompt length: {len(analysis_prompt)} characters")
            message = self.client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": analysis_prompt,
                    }
                ],
            )
            logger.info("✅ AI call completed successfully")

            # Parse the AI response
            ai_response = message.content[0].text.strip()
            logger.info(f"AI response received, length: {len(ai_response)}")
            insights_data = self._parse_insights_response(ai_response)

            if not insights_data:
                logger.error("Failed to parse AI insights response")
                return []

            # Convert to AIInsight objects
            from src.insights.schemas import AIInsight
            insights = []

            for insight_data in insights_data:
                try:
                    insight = AIInsight(
                        title=insight_data.get("title", "Financial Insight"),
                        message=insight_data.get("message", ""),
                        type=insight_data.get("type", "info"),
                        actionable=insight_data.get("actionable", ""),
                    )
                    insights.append(insight)
                except Exception as e:
                    logger.error(f"Error creating insight object: {e}")
                    continue

            logger.info(f"🎯 Generated {len(insights)} AI insights")
            for i, insight in enumerate(insights):
                logger.info(f"  Insight {i+1}: {insight.title} ({insight.type})")
            return insights

        except Exception as error:
            logger.error(f"Error generating AI insights: {error}", exc_info=True)
            return []

    def _format_monthly_data(self, monthly_data, sorted_months):
        """Format monthly data for AI prompt."""
        lines = []
        for month in sorted_months[-6:]:  # Last 6 months
            data = monthly_data[month]
            net = data["income"] - data["expenses"]
            lines.append(f"{month}: Income ${data['income']:.2f}, Expenses ${data['expenses']:.2f}, Net ${net:.2f}")
        return "\n".join(lines)

    def _format_category_data(self, top_categories, category_totals):
        """Format category data for AI prompt."""
        lines = []
        total_spending = sum(category_totals.values())
        for category, amount in top_categories:
            percentage = (amount / total_spending * 100) if total_spending > 0 else 0
            lines.append(f"{category}: ${amount:.2f} ({percentage:.1f}%)")
        return "\n".join(lines)

    def _format_merchant_data(self, top_merchants):
        """Format merchant data for AI prompt."""
        lines = []
        for merchant, count in top_merchants:
            lines.append(f"{merchant}: {count} transactions")
        return "\n".join(lines) if lines else "No merchant data available"

    def _format_budget_data(self, budgets_dict, current_month_spending):
        """Format budget data for AI prompt."""
        lines = []
        for category, budget_info in budgets_dict.items():
            limit = budget_info.get("limit", 0)
            spent = current_month_spending.get(category, 0)
            percentage = (spent / limit * 100) if limit > 0 else 0
            status = "🔴 OVER" if spent > limit else "✅ OK"
            lines.append(f"{category}: ${spent:.2f} / ${limit:.2f} ({percentage:.1f}%) {status}")
        return "\n".join(lines) if lines else "No budgets set"

    def _parse_insights_response(self, response_text):
        """Parse AI insights response into structured data."""
        try:
            # Clean the response
            response_text = self._clean_ai_response(response_text)

            # Parse JSON
            insights_data = json.loads(response_text)

            if not isinstance(insights_data, list):
                insights_data = [insights_data]

            # Validate insights
            valid_insights = []
            valid_types = ["warning", "success", "info"]

            for insight in insights_data:
                if isinstance(insight, dict) and "title" in insight and "message" in insight:
                    # Ensure type is valid
                    if insight.get("type") not in valid_types:
                        insight["type"] = "info"
                    valid_insights.append(insight)

            return valid_insights

        except Exception as e:
            logger.error(f"Error parsing insights response: {e}")
            return []


    async def suggest_goal_allocations(
        self,
        income_amount: float,
        income_category: str,
        income_description: str,
        user_goals: list[dict[str, Any]],
        user_id: int | None = None,
    ) -> list[dict[str, Any]]:
        """Suggest how to allocate income to user's financial goals using AI."""
        try:
            # Build goals summary for AI
            goals_summary = []
            for goal in user_goals:
                goal_info = {
                    "id": goal.get("id"),
                    "title": goal.get("title"),
                    "type": goal.get("goal_type"),  # spending, saving, debt
                    "priority": goal.get("priority"),  # 1=high, 2=medium, 3=low
                    "target_amount": goal.get("target_amount"),
                    "current_amount": goal.get("current_amount"),
                    "remaining": goal.get("target_amount", 0) - goal.get("current_amount", 0),
                    "target_date": goal.get("target_date"),
                    "description": goal.get("description", ""),
                }
                goals_summary.append(goal_info)

            prompt = f"""Suggest how to allocate this income to the user's financial goals.

Income Details:
- Amount: {income_amount}
- Category: {income_category}
- Description: {income_description}

User's Financial Goals:
{json.dumps(goals_summary, indent=2)}

Provide allocation suggestions as a JSON array. Each suggestion should include:
- goal_id: The ID of the goal
- amount_allocated: Amount to allocate (must be <= income amount)
- allocation_percentage: Percentage of income allocated
- reasoning: Brief explanation why this allocation makes sense

Rules:
1. Total allocations must not exceed the income amount
2. Prioritize high-priority goals (priority=1) over lower priorities
3. Consider goal types: saving goals need regular contributions, debt goals benefit from larger payments
4. Consider target dates - urgent goals need more allocation
5. Don't over-allocate to already completed goals
6. For regular income (salary), suggest balanced allocations
7. For windfalls (bonus, gifts), can suggest larger allocations to specific goals
8. Return empty array if no suitable goals exist

Example response:
[
  {{"goal_id": 1, "amount_allocated": 500.00, "allocation_percentage": 50.0, "reasoning": "Emergency fund is high priority and needs regular contributions"}},
  {{"goal_id": 3, "amount_allocated": 300.00, "allocation_percentage": 30.0, "reasoning": "Debt payoff saves on interest costs"}}
]

Provide ONLY the JSON array, no additional text."""

            message = self.client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=1000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            # Parse AI response
            response_text = self._clean_ai_response(message.content[0].text.strip())
            allocations = json.loads(response_text)

            # Validate allocations
            total_allocated = sum(alloc.get("amount_allocated", 0) for alloc in allocations)
            if total_allocated > income_amount:
                logger.warning(f"AI suggested allocations exceed income amount: {total_allocated} > {income_amount}")
                # Scale down proportionally
                scale_factor = income_amount / total_allocated
                for alloc in allocations:
                    alloc["amount_allocated"] = round(alloc["amount_allocated"] * scale_factor, 2)
                    alloc["allocation_percentage"] = round(
                        (alloc["amount_allocated"] / income_amount) * 100, 1
                    )

            # Add AI metadata
            for alloc in allocations:
                alloc["ai_suggested"] = True
                alloc["ai_confidence"] = 0.85  # Can be refined based on various factors

            return allocations

        except Exception as error:
            logger.error(f"Error suggesting goal allocations: {error}")
            return []

# Note: AIService instances should be created with category_service dependency
# No global instance to ensure proper dependency injection
