"""
Belvo API service for bank integrations in Latin America.

This service handles Belvo API interactions including widget token generation,
account fetching, transaction synchronization, institution management, and expense conversion.
"""

import logging
from typing import Any

import aiohttp

from src.config import settings

logger = logging.getLogger(__name__)


class BelvoService:
    """Service for Belvo API operations."""

    def __init__(self):
        """Initialize Belvo service with API credentials."""
        self.base_url = (
            "https://sandbox.belvo.com"
            if settings.BELVO_ENVIRONMENT == "sandbox"
            else "https://api.belvo.com"
        )
        self.secret_id = settings.BELVO_SECRET_ID
        self.secret_password = settings.BELVO_SECRET_PASSWORD

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

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, json=payload, headers={"Content-Type": "application/json"}
                ) as response:
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

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, json=payload, headers={"Content-Type": "application/json"}
                ) as response:
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

            async with aiohttp.ClientSession() as session, session.get(
                url, auth=aiohttp.BasicAuth(self.secret_id, self.secret_password)
            ) as response:
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

            async with aiohttp.ClientSession() as session, session.post(
                url,
                auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                json={"link": link_id},
            ) as response:
                if response.status == 201:
                    data = await response.json()
                    logger.info(
                        f"Retrieved {len(data)} accounts for link {link_id}"
                    )
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

            async with aiohttp.ClientSession() as session, session.post(
                url,
                auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                json=payload,
            ) as response:
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
        self, transactions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Convert Belvo transactions to expense format, filtering out income."""
        expenses = []

        for transaction in transactions:
            try:
                # Skip income transactions (positive amounts in most cases)
                amount = float(transaction.get("amount", 0))
                if amount >= 0:
                    continue  # Skip income

                # Map Belvo transaction fields to expense format
                expense_data = {
                    "amount": abs(amount),  # Convert to positive for expense
                    "description": transaction.get("description", "").strip()
                    or "Unknown transaction",
                    "date": transaction.get("value_date")
                    or transaction.get("accounting_date"),
                    "category": self._map_transaction_category(transaction),
                    "currency": transaction.get("currency", "USD"),
                    "provider_transaction_id": transaction.get("id"),
                    "provider_data": {
                        "belvo_id": transaction.get("id"),
                        "account_id": transaction.get("account", {}).get("id")
                        if isinstance(transaction.get("account"), dict)
                        else transaction.get("account"),
                        "reference": transaction.get("reference"),
                        "type": transaction.get("type"),
                        "status": transaction.get("status"),
                        "merchant": transaction.get("merchant", {})
                        if isinstance(transaction.get("merchant"), dict)
                        else None,
                        "category": transaction.get("category"),
                        "subcategory": transaction.get("subcategory"),
                    },
                }

                # Validate required fields
                if expense_data["date"] and expense_data["amount"] > 0:
                    expenses.append(expense_data)
                else:
                    logger.warning(
                        f"Skipping transaction with missing required fields: {transaction.get('id')}"
                    )

            except Exception as e:
                logger.warning(
                    f"Failed to convert transaction {transaction.get('id', 'unknown')}: {e}"
                )
                continue

        logger.info(
            f"Converted {len(expenses)} transactions to expenses (filtered out income)"
        )
        return expenses

    def _map_transaction_category(self, transaction: dict[str, Any]) -> str:
        """Map Belvo transaction category to our expense categories."""
        belvo_category = transaction.get("category", "").lower()
        belvo_subcategory = transaction.get("subcategory", "").lower()

        # Category mapping based on Belvo's standard categories
        category_mapping = {
            "food_and_drinks": "Food & Dining",
            "groceries": "Groceries",
            "restaurants": "Food & Dining",
            "transportation": "Transportation",
            "fuel": "Transportation",
            "public_transport": "Transportation",
            "shopping": "Shopping",
            "entertainment": "Entertainment",
            "health": "Healthcare",
            "education": "Education",
            "bills": "Bills & Utilities",
            "utilities": "Bills & Utilities",
            "insurance": "Insurance",
            "home": "Home & Garden",
            "travel": "Travel",
            "fees": "Fees & Charges",
            "atm": "Fees & Charges",
            "transfer": "Transfer",
            "investment": "Investment",
            "income": "Income",
            "salary": "Income",
        }

        # First try exact match
        if belvo_category in category_mapping:
            return category_mapping[belvo_category]

        # Try subcategory
        if belvo_subcategory in category_mapping:
            return category_mapping[belvo_subcategory]

        # Fallback based on keywords in description
        description = transaction.get("description", "").lower()
        if any(word in description for word in ["restaurant", "food", "cafe", "pizza"]):
            return "Food & Dining"
        elif any(word in description for word in ["gas", "fuel", "uber", "taxi"]):
            return "Transportation"
        elif any(word in description for word in ["market", "supermarket", "grocery"]):
            return "Groceries"
        elif any(word in description for word in ["pharmacy", "hospital", "clinic"]):
            return "Healthcare"

        # Default category
        return "Other"

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

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                    json=payload,
                ) as response:
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

    async def get_institutions(self) -> list[dict[str, Any]]:
        """Fetch all institutions from Belvo API.

        Returns:
            List of institution dictionaries from Belvo API

        Raises:
            Exception: If API request fails
        """
        all_institutions = []

        try:
            async with aiohttp.ClientSession() as session:
                page = 1

                while True:
                    # Use GET request with pagination
                    url = f"{self.base_url}/api/institutions/?page={page}"

                    logger.info(f"Fetching institutions page {page} from: {url}")

                    async with session.get(
                        url,
                        auth=aiohttp.BasicAuth(self.secret_id, self.secret_password),
                        headers={"Content-Type": "application/json"},
                    ) as response:
                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(
                                f"Failed to get institutions page {page}: {error_text}"
                            )
                            raise Exception(
                                f"Failed to get institutions: {response.status}"
                            )

                        result = await response.json()

                        # Handle Belvo's paginated response format
                        if isinstance(result, dict):
                            page_institutions = result.get("results", [])
                            has_next = result.get("next") is not None
                            total_count = result.get("count", 0)

                            if page == 1:
                                logger.info(
                                    f"Total institutions available: {total_count}"
                                )
                        else:
                            # Fallback for unexpected format
                            logger.warning(
                                f"Unexpected response format: {type(result)}"
                            )
                            page_institutions = (
                                result if isinstance(result, list) else []
                            )
                            has_next = False

                        logger.info(
                            f"Page {page}: Got {len(page_institutions)} institutions"
                        )

                        # Add institutions to our list
                        all_institutions.extend(page_institutions)

                        # If no institutions on this page, we're done
                        if not page_institutions or not has_next:
                            break

                        page += 1

                        # Safety check to prevent infinite loops
                        if page > 100:  # Reasonable limit
                            logger.warning("Reached page limit (100) for institutions")
                            break

            logger.info(
                f"Completed institutions fetch: {len(all_institutions)} total institutions"
            )
            return all_institutions

        except Exception as e:
            logger.error(f"Error fetching institutions from Belvo: {e}")
            raise

    def convert_institution_to_create_model(self, institution_data: dict[str, Any]):
        """Convert Belvo institution data to our create model.

        Args:
            institution_data: Raw institution data from Belvo API

        Returns:
            Dict with institution data for creation or None if data is invalid
        """
        try:
            from ..integrations.institution_models import (
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


# Global service instance
belvo_service = BelvoService()
