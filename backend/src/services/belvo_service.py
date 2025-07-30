"""
Belvo API service for bank integrations in Latin America.

This service handles Belvo API interactions including widget token generation,
account fetching, transaction synchronization, institution management, and expense conversion.
"""

import logging
from datetime import UTC, datetime
from typing import Any

import aiohttp

from src.config import settings
from src.currency.constants import Currency
from src.currency.service import currency_service
from src.expenses.schemas import ExpenseCreate

logger = logging.getLogger(__name__)


class BelvoService:
    """Service for Belvo API operations."""

    def __init__(self, ai_service=None):
        """Initialize Belvo service with API credentials and optional AI service."""
        self.base_url = (
            "https://sandbox.belvo.com"
            if settings.BELVO_ENVIRONMENT == "sandbox"
            else "https://api.belvo.com"
        )
        # Ensure credentials are strings
        self.secret_id = (
            str(settings.BELVO_SECRET_ID) if settings.BELVO_SECRET_ID else ""
        )
        self.secret_password = (
            str(settings.BELVO_SECRET_PASSWORD)
            if settings.BELVO_SECRET_PASSWORD
            else ""
        )
        self.ai_service = ai_service

    async def get_widget_access_token(self, external_id: str) -> str:
        """Generate widget access token for Belvo Connect Widget using the working API structure."""
        try:
            url = f"{self.base_url}/api/token/"

            # Use the correct payload structure that was working before
            payload = {
                "id": self.secret_id,
                "password": self.secret_password,
                "scopes": "read_institutions,write_links,read_consents,write_consents",
                # Store data for 300 days (recurrent links need longer retention)
                "stale_in": "300d",
                # Enable asynchronous historical data workflow for recurrent links
                "fetch_historical": True,
                "fetch_resources": [
                    "TRANSACTIONS",  # Transaction history and updates
                ],
            }

            # Add external_id if provided for tracking
            if external_id:
                payload["external_id"] = external_id

            async with (
                aiohttp.ClientSession() as session,
                session.post(url, json=payload, headers={"Content-Type": "application/json"}) as response,
            ):
                    if response.status in [200, 201]:
                        data = await response.json()
                        logger.info(
                            f"Successfully generated Belvo widget token for external_id: {external_id}"
                        )
                        return data["access"]
                    else:
                        error_text = await response.text()
                        logger.error(
                            f"Failed to generate widget token: {response.status} - {error_text}"
                        )
                        raise Exception(
                            f"Failed to generate widget token: {response.status}"
                        )

        except Exception as e:
            logger.error(f"Error generating Belvo widget token: {e}")
            raise

    async def get_consent_management_token(
        self,
        cpf: str,
        full_name: str,
        cnpj: str | None = None,
        terms_and_conditions_url: str | None = None,
    ) -> str:
        """Generate access token for consent management portal using the working API structure."""
        try:
            url = f"{self.base_url}/api/token/"

            identification_info = [{"type": "CPF", "number": cpf, "name": full_name}]

            # Add CNPJ info for business users
            if cnpj:
                identification_info.append(
                    {"type": "CNPJ", "number": cnpj, "name": full_name}
                )

            payload = {
                "id": self.secret_id,
                "password": self.secret_password,
                "scopes": "read_consents,write_consents,write_consent_callback",
                "widget": {
                    "openfinance_feature": "consent_management",
                    "consent": {
                        "terms_and_conditions_url": terms_and_conditions_url
                        or "https://example.com/terms",
                        "permissions": [
                            "REGISTER",
                            "ACCOUNTS",
                            "CREDIT_CARDS",
                            "CREDIT_OPERATIONS",
                        ],
                        "identification_info": identification_info,
                    },
                },
            }

            async with (
                aiohttp.ClientSession() as session,
                session.post(url, json=payload, headers={"Content-Type": "application/json"}) as response,
            ):
                    if response.status in [200, 201]:
                        data = await response.json()
                        logger.info("Successfully generated consent management token")
                        return data["access"]
                    else:
                        error_text = await response.text()
                        logger.error(
                            f"Failed to generate consent management token: {response.status} - {error_text}"
                        )
                        raise Exception(
                            f"Failed to generate consent management token: {response.status}"
                        )

        except Exception as e:
            logger.error(f"Error generating consent management token: {e}")
            raise

    async def get_institutions(self) -> list[dict[str, Any]]:
        """Get available Belvo institutions."""
        try:
            url = f"{self.base_url}/api/institutions/"

            async with (
                aiohttp.ClientSession() as session,
                session.get(
                    url, auth=aiohttp.BasicAuth(self.secret_id, self.secret_password)
                ) as response,
            ):
                if response.status == 200:
                    data = await response.json()
                    logger.info(f"Retrieved {len(data['results'])} institutions")
                    return data["results"]
                else:
                    error_text = await response.text()
                    logger.error(
                        f"Failed to get institutions: {response.status} - {error_text}"
                    )
                    return []

        except Exception as e:
            logger.error(f"Error getting Belvo institutions: {e}")
            return []

    async def get_accounts(self, link_id: str) -> list[dict[str, Any]]:
        """Get accounts for a specific link."""
        try:
            url = f"{self.base_url}/api/accounts/"

            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    url,
                    auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                    json={"link": link_id},
                ) as response,
            ):
                if response.status == 201:
                    data = await response.json()
                    logger.info(f"Retrieved {len(data)} accounts for link {link_id}")
                    return data
                else:
                    error_text = await response.text()
                    logger.error(
                        f"Failed to get accounts: {response.status} - {error_text}"
                    )
                    return []

        except Exception as e:
            logger.error(f"Error getting Belvo accounts: {e}")
            return []

    async def get_transactions(
        self, link_id: str, date_from: str | None = None, date_to: str | None = None
    ) -> list[dict[str, Any]]:
        """Get transactions for a specific link."""
        try:
            url = f"{self.base_url}/api/transactions/"
            payload = {"link": link_id}

            if date_from:
                payload["date_from"] = date_from
            if date_to:
                payload["date_to"] = date_to

            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    url,
                    auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                    json=payload,
                ) as response,
            ):
                if response.status == 201:
                    data = await response.json()
                    logger.info(
                        f"Retrieved {len(data)} transactions for link {link_id}"
                    )
                    return data
                else:
                    error_text = await response.text()
                    logger.error(
                        f"Failed to get transactions: {response.status} - {error_text}"
                    )
                    return []

        except Exception as e:
            logger.error(f"Error getting Belvo transactions: {e}")
            return []

    async def get_all_transactions_paginated(
        self, link_id: str, date_from: str | None = None, date_to: str | None = None
    ) -> list[dict[str, Any]]:
        """Get all transactions with pagination support."""
        all_transactions = []
        next_url = None
        page = 1

        try:
            while True:
                if next_url:
                    # Use next page URL
                    url = next_url
                    payload = {}
                else:
                    # First page
                    url = f"{self.base_url}/api/transactions/"
                    payload = {"link": link_id}

                    if date_from:
                        payload["date_from"] = date_from
                    if date_to:
                        payload["date_to"] = date_to

                async with aiohttp.ClientSession() as session:
                    if next_url:
                        # GET request for pagination
                        async with session.get(
                            url,
                            auth=aiohttp.BasicAuth(
                                self.secret_id, self.secret_password
                            ),
                        ) as response:
                            response_data = await self._handle_response(
                                response, f"get transactions page {page}"
                            )
                    else:
                        # POST request for first page
                        async with session.post(
                            url,
                            auth=aiohttp.BasicAuth(
                                self.secret_id, self.secret_password
                            ),
                            json=payload,
                        ) as response:
                            response_data = await self._handle_response(
                                response, f"get transactions page {page}"
                            )

                if not response_data:
                    break

                # Handle both paginated and non-paginated responses
                if isinstance(response_data, dict) and "results" in response_data:
                    # Paginated response
                    transactions = response_data["results"]
                    all_transactions.extend(transactions)
                    next_url = response_data.get("next")
                    logger.info(
                        f"Page {page}: retrieved {len(transactions)} transactions"
                    )

                    if not next_url:
                        break
                else:
                    # Non-paginated response (list of transactions)
                    all_transactions.extend(response_data)
                    break

                page += 1

                # Safety limit to prevent infinite loops
                if page > 100:
                    logger.warning(
                        "Reached maximum page limit (100) for transaction fetching"
                    )
                    break

            logger.info(
                f"Retrieved total of {len(all_transactions)} transactions for link {link_id}"
            )
            return all_transactions

        except Exception as e:
            logger.error(f"Error getting paginated transactions: {e}")
            return all_transactions  # Return what we got so far

    async def convert_to_expenses(
        self, transactions: list[dict[str, Any]], user_id: int | None = None
    ) -> list:
        """Convert Belvo transactions to ExpenseCreate objects, including both expenses and income."""
        # Using imports from module level

        expenses = []

        for transaction in transactions:
            try:
                # Get transaction details with proper None handling
                transaction_id = transaction.get("id")
                amount = float(transaction.get("amount", 0))
                transaction_type = (
                    transaction.get("type") or ""
                ).upper()  # INFLOW or OUTFLOW
                description = (
                    transaction.get("description") or ""
                ).strip() or "Unknown transaction"
                transaction_date = transaction.get("value_date") or transaction.get(
                    "accounting_date"
                )
                original_currency = transaction.get("currency") or "BRL"

                # Validate required fields
                if not transaction_id or not transaction_date or amount <= 0:
                    logger.warning(
                        f"Skipping transaction {transaction_id} with missing required fields"
                    )
                    continue

                # Determine if it's income or expense based on Belvo's type field
                if transaction_type == "INFLOW":
                    expense_type = "income"
                elif transaction_type == "OUTFLOW":
                    expense_type = "expense"
                else:
                    logger.warning(
                        f"Unknown transaction type {transaction_type}, defaulting to expense"
                    )
                    expense_type = "expense"

                # Convert currency enum if needed
                try:
                    currency_enum = Currency(original_currency)
                except ValueError:
                    logger.warning(
                        f"Unknown currency {original_currency}, defaulting to BRL"
                    )
                    currency_enum = Currency.BRL

                # Get current exchange rates for multi-currency support
                exchange_rates = await currency_service.get_current_rates()

                # Convert to all supported currencies
                amounts = await currency_service.convert_to_all_currencies(
                    amount, currency_enum, exchange_rates
                )

                # Extract date properly (handle both date string and datetime)
                if isinstance(transaction_date, str):
                    # Handle different date formats
                    if "T" in transaction_date:
                        # ISO datetime format, extract date part
                        date_str = transaction_date.split("T")[0]
                    else:
                        # Already in YYYY-MM-DD format
                        date_str = transaction_date
                else:
                    # Convert datetime object to string
                    date_str = (
                        transaction_date.strftime("%Y-%m-%d")
                        if transaction_date
                        else None
                    )

                if not date_str:
                    logger.warning(f"Invalid date for transaction {transaction_id}")
                    continue

                # Get category using AI if available, otherwise fallback to rule-based
                category = await self._map_transaction_category(transaction, user_id)

                # Create expense data
                expense_data = ExpenseCreate(
                    date=date_str,
                    amount=amount,
                    category=category,
                    description=description,
                    merchant=self._extract_merchant_name(transaction),
                    type=expense_type,
                    source="belvo-integration",
                    items=None,
                    transaction_id=transaction_id,
                    original_currency=original_currency,
                    amounts=amounts,
                    exchange_rates=exchange_rates,
                    exchange_date=datetime.now(UTC).isoformat(),
                )

                expenses.append(expense_data)

            except Exception as e:
                logger.warning(
                    f"Failed to convert transaction {transaction.get('id', 'unknown')}: {e}"
                )
                continue

        logger.info(
            f"Converted {len(expenses)} Belvo transactions (both income and expenses)"
        )
        return expenses

    async def _map_transaction_category(
        self, transaction: dict[str, Any], user_id: int | None = None
    ) -> str:
        """Map Belvo transaction category to our expense categories using AI if available."""
        # Try AI categorization first if AI service is available
        if self.ai_service and user_id:
            try:
                # Prepare transaction data for AI categorization
                ai_transaction = {
                    "description": transaction.get("description", ""),
                    "merchant": self._extract_merchant_name(transaction),
                    "category": transaction.get("category", ""),
                    "subcategory": transaction.get("subcategory", ""),
                    "amount": transaction.get("amount", 0),
                }

                category = await self.ai_service.categorize_transaction(
                    ai_transaction, user_id
                )
                logger.info(f"AI categorized transaction as: {category}")
                return category

            except Exception as e:
                logger.warning(
                    f"AI categorization failed, falling back to rule-based: {e}"
                )

        # Fallback to rule-based categorization
        return self._fallback_rule_based_categorization(transaction)

    def _fallback_rule_based_categorization(self, transaction: dict[str, Any]) -> str:
        """Fallback rule-based categorization when AI is not available or fails."""
        belvo_category = (transaction.get("category") or "").lower()
        belvo_subcategory = (transaction.get("subcategory") or "").lower()
        description = (transaction.get("description") or "").lower()

        # Category mapping based on Belvo's categories (from the example)
        category_mapping = {
            # Online & Digital
            "online platforms & leisure": "Entertainment",
            "online platforms": "Shopping",
            "digital services": "Utilities",
            # Food & Dining
            "food & drinks": "Food",
            "food and drinks": "Food",
            "restaurants": "Food",
            "groceries": "Food",
            "food_and_drinks": "Food",
            # Transportation
            "transportation": "Transport",
            "fuel": "Transport",
            "public transport": "Transport",
            "taxi": "Transport",
            "uber": "Transport",
            # Shopping
            "shopping": "Shopping",
            "retail": "Shopping",
            # Entertainment
            "entertainment": "Entertainment",
            "leisure": "Entertainment",
            # Health
            "health": "Healthcare",
            "healthcare": "Healthcare",
            "medical": "Healthcare",
            "pharmacy": "Healthcare",
            # Education
            "education": "Education",
            # Bills & Utilities
            "bills": "Utilities",
            "utilities": "Utilities",
            "internet": "Utilities",
            "phone": "Utilities",
            "electricity": "Utilities",
            "water": "Utilities",
            # Financial Services
            "bank fees": "Other",
            "fees": "Other",
            "atm": "Other",
            "transfer": "Other",
            "investment": "Other",
            # Income categories
            "salary": "Other",  # Will be marked as income by type
            "income": "Other",  # Will be marked as income by type
            "dividends": "Other",
            "interest": "Other",
        }

        # First try exact match on category
        if belvo_category in category_mapping:
            return category_mapping[belvo_category]

        # Try subcategory if exists
        if belvo_subcategory and belvo_subcategory in category_mapping:
            return category_mapping[belvo_subcategory]

        # Fallback based on keywords in description
        if any(
            word in description
            for word in ["restaurant", "food", "cafe", "pizza", "delivery"]
        ):
            return "Food"
        elif any(
            word in description for word in ["gas", "fuel", "uber", "taxi", "transport"]
        ):
            return "Transport"
        elif any(
            word in description
            for word in ["market", "supermarket", "grocery", "mercado"]
        ):
            return "Food"
        elif any(
            word in description
            for word in ["pharmacy", "hospital", "clinic", "doctor", "medical"]
        ):
            return "Healthcare"
        elif any(
            word in description
            for word in ["internet", "phone", "electricity", "water", "bill"]
        ):
            return "Utilities"
        elif any(
            word in description
            for word in ["education", "school", "university", "course"]
        ):
            return "Education"
        elif any(
            word in description
            for word in ["entertainment", "movie", "game", "streaming"]
        ):
            return "Entertainment"
        elif any(
            word in description for word in ["shopping", "store", "purchase", "buy"]
        ):
            return "Shopping"

        # Default category
        return "Other"

    def _extract_merchant_name(self, transaction: dict[str, Any]) -> str:
        """Extract merchant name from Belvo transaction data."""
        # Try different sources for merchant name
        merchant_data = transaction.get("merchant", {})

        if isinstance(merchant_data, dict):
            # Try merchant name from merchant object
            merchant_name = (merchant_data.get("name") or "").strip()
            if merchant_name:
                return merchant_name

        # Fallback to description or reference with None handling
        description = (transaction.get("description") or "").strip()
        reference = (transaction.get("reference") or "").strip()

        # Use description if available, otherwise reference, otherwise "Unknown"
        return description or reference or "Unknown Merchant"

    async def trigger_historical_update(
        self, link_id: str, resources: list[str]
    ) -> dict[str, Any]:
        """Trigger historical data update for specific resources."""
        try:
            url = f"{self.base_url}/api/historical-updates/"

            payload = {
                "link": link_id,
                "resources": resources,
                "async_": True,  # Use async workflow
            }

            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    url,
                    auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                    json=payload,
                ) as response,
            ):
                    if response.status == 201:
                        data = await response.json()
                        logger.info(
                            f"Historical update triggered for link {link_id}: {data.get('request_id')}"
                        )
                        return data
                    else:
                        error_text = await response.text()
                        logger.error(
                            f"Failed to trigger historical update: {response.status} - {error_text}"
                        )
                        raise Exception(
                            f"Failed to trigger historical update: {response.status}"
                        )

        except Exception as e:
            logger.error(f"Error triggering historical update: {e}")
            raise

    def convert_institution_to_create_model(self, institution_data: dict[str, Any]):
        """Convert Belvo institution data to our create model.

        Args:
            institution_data: Raw institution data from Belvo API

        Returns:
            Dict with institution data for creation or None if data is invalid
        """
        try:
            from ..integrations.institution_models import (  # noqa: PLC0415
                BelvoInstitutionStatus,
                BelvoInstitutionType,
            )

            # Extract required fields
            belvo_id = institution_data.get("id")
            name = institution_data.get("name", "")
            display_name = institution_data.get("display_name", name)
            code = institution_data.get("code", "")

            if not all([belvo_id, name, display_name, code]):
                logger.warning(
                    f"Missing required fields in institution {belvo_id}: {list(institution_data.keys())}"
                )
                return None

            # Map type (default to BANK if not specified)
            institution_type = institution_data.get("type", "bank").upper()
            try:
                type_enum = BelvoInstitutionType(institution_type.lower())
            except ValueError:
                logger.warning(
                    f"Unknown institution type '{institution_type}' for {belvo_id}, defaulting to BANK"
                )
                type_enum = BelvoInstitutionType.BANK

            # Map status (default to HEALTHY if not specified)
            status_str = institution_data.get("status", "healthy").upper()
            try:
                status_enum = BelvoInstitutionStatus(status_str.lower())
            except ValueError:
                logger.warning(
                    f"Unknown institution status '{status_str}' for {belvo_id}, defaulting to HEALTHY"
                )
                status_enum = BelvoInstitutionStatus.HEALTHY

            # Get country codes - use first one as primary
            country_codes = institution_data.get("country_codes", [])
            if not country_codes:
                logger.warning(f"No country codes for institution {belvo_id}")
                return None

            primary_country = country_codes[0] if country_codes else "BR"

            # Get primary color (default to blue if not specified)
            primary_color = institution_data.get("primary_color", "#056dae")
            if not primary_color.startswith("#"):
                primary_color = f"#{primary_color}"

            return {
                "belvo_id": belvo_id,
                "name": name,
                "display_name": display_name,
                "code": code,
                "type": type_enum,
                "status": status_enum,
                "country_code": primary_country,
                "country_codes": country_codes,
                "primary_color": primary_color,
                "logo": institution_data.get("logo"),
                "icon_logo": institution_data.get("icon_logo"),
                "text_logo": institution_data.get("text_logo"),
                "website": institution_data.get("website"),
            }

        except Exception as e:
            logger.error(
                f"Error converting institution data {institution_data.get('id', 'unknown')}: {e}"
            )
            return None

    async def get_transaction_by_id(self, transaction_id: str) -> dict[str, Any] | None:
        """Get a specific transaction by its ID."""
        try:
            url = f"{self.base_url}/api/transactions/{transaction_id}/"

            async with (
                aiohttp.ClientSession() as session,
                session.get(
                    url,
                    auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                ) as response,
            ):
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"Retrieved transaction {transaction_id}")
                        return data
                    else:
                        error_text = await response.text()
                        logger.error(
                            f"Failed to get transaction {transaction_id}: {response.status} - {error_text}"
                        )
                        return None

        except Exception as e:
            logger.error(f"Error getting transaction {transaction_id}: {e}")
            return None

    async def get_transactions_by_ids(
        self, transaction_ids: list[str]
    ) -> list[dict[str, Any]]:
        """Get multiple transactions by their IDs."""
        transactions = []

        for transaction_id in transaction_ids:
            transaction = await self.get_transaction_by_id(transaction_id)
            if transaction:
                transactions.append(transaction)
            else:
                logger.warning(f"Failed to retrieve transaction {transaction_id}")

        logger.info(
            f"Retrieved {len(transactions)} out of {len(transaction_ids)} transactions"
        )
        return transactions

    async def _handle_response(
        self, response: aiohttp.ClientResponse, operation: str
    ) -> dict[str, Any] | None:
        """Handle API response with proper error handling."""
        if response.status in [200, 201]:
            return await response.json()
        else:
            error_text = await response.text()
            logger.error(f"Failed to {operation}: {response.status} - {error_text}")
            return None


# Helper function to create BelvoService with dependencies
def create_belvo_service(ai_service=None) -> BelvoService:
    """Create BelvoService with optional AI service dependency."""
    return BelvoService(ai_service=ai_service)


# Global service instance (without AI - for backward compatibility)
belvo_service = BelvoService()
