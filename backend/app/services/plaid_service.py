import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import plaid
from plaid.api import plaid_api
from plaid.api_client import ApiClient
from plaid.configuration import Configuration
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest,
)
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.transactions_get_request import TransactionsGetRequest

from ..core.config import settings
from ..models.expense import ExpenseCreate
from ..models.integration import PlaidAccount, PlaidTransaction
from ..services.currency_service import Currency, currency_service

logger = logging.getLogger(__name__)


class PlaidService:
    """Service for Plaid API integration."""

    def __init__(self):
        # Plaid configuration
        configuration = Configuration(
            host=getattr(
                plaid.Environment, settings.PLAID_ENV, plaid.Environment.sandbox
            ),
            api_key={
                'clientId': settings.PLAID_CLIENT_ID,
                'secret': settings.PLAID_SECRET,
            },
        )
        api_client = ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)

    async def create_link_token(self, user_id: str) -> str:
        """Create a link token for Plaid Link initialization."""
        try:
            request = LinkTokenCreateRequest(
                products=[Products('transactions')],
                client_name="AI Finance Manager",
                country_codes=[
                    CountryCode('US'),
                    CountryCode('CA'),
                ],  # Add more as needed
                language='en',
                user=LinkTokenCreateRequestUser(client_user_id=str(user_id)),
            )

            response = self.client.link_token_create(request)
            return response['link_token']

        except Exception as e:
            logger.error(f"Failed to create Plaid link token: {e}")
            raise Exception(f"Failed to create link token: {str(e)}")

    async def exchange_public_token(self, public_token: str) -> Dict[str, str]:
        """Exchange public token for access token."""
        try:
            request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = self.client.item_public_token_exchange(request)

            return {
                'access_token': response['access_token'],
                'item_id': response['item_id'],
            }

        except Exception as e:
            logger.error(f"Failed to exchange Plaid public token: {e}")
            raise Exception(f"Failed to exchange public token: {str(e)}")

    async def get_accounts(self, access_token: str) -> List[PlaidAccount]:
        """Get accounts for a Plaid item."""
        try:
            request = AccountsGetRequest(access_token=access_token)
            response = self.client.accounts_get(request)

            accounts = []
            for account in response['accounts']:
                plaid_account = PlaidAccount(
                    id=account['account_id'],
                    name=account['name'],
                    type=account['type'],
                    subtype=account['subtype'],
                    balance=account['balances']['current'] or 0,
                    currency=account['balances']['iso_currency_code'] or 'USD',
                    institution_id=account.get('institution_id', ''),
                )
                accounts.append(plaid_account)

            return accounts

        except Exception as e:
            logger.error(f"Failed to get Plaid accounts: {e}")
            raise Exception(f"Failed to get accounts: {str(e)}")

    async def get_transactions(
        self,
        access_token: str,
        start_date: datetime,
        end_date: datetime,
        account_ids: Optional[List[str]] = None,
    ) -> List[PlaidTransaction]:
        """Get transactions from Plaid."""
        try:
            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date.date(),
                end_date=end_date.date(),
                account_ids=account_ids,
            )

            response = self.client.transactions_get(request)

            transactions = []
            for txn in response['transactions']:
                transaction = PlaidTransaction(
                    id=txn['transaction_id'],
                    account_id=txn['account_id'],
                    amount=abs(txn['amount']),  # Plaid amounts are negative for debits
                    currency=txn['iso_currency_code'] or 'USD',
                    date=datetime.strptime(txn['date'], '%Y-%m-%d'),
                    name=txn['name'],
                    merchant_name=txn.get('merchant_name'),
                    category=txn.get('category', []),
                    pending=txn.get('pending', False),
                )
                transactions.append(transaction)

            return transactions

        except Exception as e:
            logger.error(f"Failed to get Plaid transactions: {e}")
            raise Exception(f"Failed to get transactions: {str(e)}")

    def _map_plaid_category(self, categories: List[str]) -> str:
        """Map Plaid categories to our expense categories."""
        if not categories:
            return 'Other'

        primary_category = categories[0].lower()

        category_mapping = {
            'food and drink': 'Dining',
            'shops': 'Groceries',
            'transportation': 'Transport',
            'travel': 'Transport',
            'payment': 'Other',
            'bank fees': 'Other',
            'entertainment': 'Entertainment',
            'healthcare': 'Healthcare',
            'service': 'Utilities',
            'deposit': 'Income',  # Handle income
        }

        for key, value in category_mapping.items():
            if key in primary_category:
                return value

        return 'Other'

    async def convert_to_expenses(
        self, transactions: List[PlaidTransaction], user_id: int
    ) -> List[ExpenseCreate]:
        """Convert Plaid transactions to expense records."""
        expenses = []

        for transaction in transactions:
            # Skip pending transactions
            if transaction.pending:
                continue

            try:
                # Get current exchange rates for multi-currency support
                original_currency = Currency(transaction.currency)
                exchange_rates = await currency_service.get_current_rates()

                # Convert to all supported currencies
                amounts = await currency_service.convert_to_all_currencies(
                    transaction.amount, original_currency, exchange_rates
                )

                # Determine transaction type and category
                category = self._map_plaid_category(transaction.category)
                tx_type = 'income' if category == 'Income' else 'expense'

                # Skip if it's an income transaction for now (focus on expenses)
                if tx_type == 'income':
                    continue

                expense = ExpenseCreate(
                    date=transaction.date.date(),
                    amount=transaction.amount,
                    category=category,
                    description=transaction.name,
                    merchant=transaction.merchant_name or "Unknown",
                    type=tx_type,
                    source='plaid-integration',
                    original_currency=transaction.currency,
                    amounts=amounts,
                    exchange_rates=exchange_rates,
                    exchange_date=datetime.utcnow(),
                )

                expenses.append(expense)

            except Exception as e:
                logger.warning(
                    f"Failed to convert Plaid transaction {transaction.id} to expense: {e}"
                )
                continue

        logger.info(f"Converted {len(expenses)} Plaid transactions to expenses")
        return expenses

    async def sync_transactions(
        self, access_token: str, user_id: int, last_sync: Optional[datetime] = None
    ) -> List[ExpenseCreate]:
        """Sync recent transactions and convert to expenses."""
        # Get transactions from last sync or last 30 days
        start_date = last_sync or (datetime.utcnow() - timedelta(days=30))
        end_date = datetime.utcnow()

        try:
            transactions = await self.get_transactions(
                access_token=access_token, start_date=start_date, end_date=end_date
            )

            expenses = await self.convert_to_expenses(transactions, user_id)
            return expenses

        except Exception as e:
            logger.error(f"Failed to sync Plaid transactions: {e}")
            raise


# Global instance
plaid_service = PlaidService()
