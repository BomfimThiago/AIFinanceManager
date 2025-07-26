import logging
import aiohttp
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from ..core.config import settings
from ..models.integration import BelvoTransaction
from ..models.expense import ExpenseCreate
from ..models.belvo_institution import BelvoInstitutionCreate, BelvoInstitutionType, BelvoInstitutionStatus
from ..services.currency_service import currency_service, Currency
from ..db.models import ExpenseSource, ExpenseType

logger = logging.getLogger(__name__)


class BelvoService:
    """Service for Belvo API integration with Brazil/Mexico banks."""
    
    def __init__(self):
        """Initialize Belvo service."""
        # Use correct Belvo URLs based on environment
        if settings.BELVO_ENV == "production":
            self.base_url = "https://api.belvo.com"
        else:
            self.base_url = "https://sandbox.belvo.com"
            
        self.secret_id = settings.BELVO_SECRET_ID
        self.secret_password = settings.BELVO_SECRET_PASSWORD
        
        if not self.secret_id or not self.secret_password:
            raise ValueError("Belvo credentials not configured")
        
        # Create aiohttp BasicAuth object
        self.auth = aiohttp.BasicAuth(self.secret_id, self.secret_password)
        
    async def get_consent_management_token(
        self, 
        cpf: str, 
        full_name: str,
        cnpj: Optional[str] = None,
        terms_and_conditions_url: Optional[str] = None
    ) -> str:
        """Generate access token for Belvo consent management portal (MBP).
        
        Args:
            cpf: User's CPF number
            full_name: User's full name  
            cnpj: User's CNPJ (for business users, optional)
            terms_and_conditions_url: URL to your terms and conditions
            
        Returns:
            Access token for the MBP
        """
        identification_info = [
            {
                "type": "CPF",
                "number": cpf,
                "name": full_name
            }
        ]
        
        # Add CNPJ info for business users
        if cnpj:
            identification_info.append({
                "type": "CNPJ", 
                "number": cnpj,
                "name": full_name
            })
        
        data = {
            "id": self.secret_id,
            "password": self.secret_password,
            "scopes": "read_consents,write_consents,write_consent_callback",
            "widget": {
                "openfinance_feature": "consent_management",
                "consent": {
                    "terms_and_conditions_url": terms_and_conditions_url or "https://example.com/terms",
                    "permissions": ["REGISTER", "ACCOUNTS", "CREDIT_CARDS", "CREDIT_OPERATIONS"],
                    "identification_info": identification_info
                }
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/token/", 
                json=data, 
                auth=self.auth,
                headers={'Content-Type': 'application/json'}
            ) as response:
                response_body = await response.read()
                
                if response.status not in [200, 201]:
                    error_text = response_body.decode('utf-8')
                    raise Exception(f"Belvo API error {response.status}: {error_text}")
                
                result = json.loads(response_body.decode('utf-8'))
                return result['access']

    async def get_widget_access_token(self, external_id: Optional[str] = None) -> str:
        """Generate widget access token with recurrent link for automatic updates.
        
        Creates a recurrent link that will automatically receive transaction updates
        every 6 days as per Belvo's refresh schedule for transaction data.
        """
        data = {
            "id": self.secret_id,
            "password": self.secret_password,
            "scopes": "read_institutions,write_links,read_consents,write_consents",
            # Store data for 300 days (recurrent links need longer retention)
            "stale_in": "300d",
            # Enable asynchronous historical data workflow for recurrent links
            "fetch_historical": True,
            "fetch_resources": [
                "TRANSACTIONS"   # Only fetch transaction history and updates
            ]
        }
        
        # Add external_id if provided for tracking
        if external_id:
            data["external_id"] = external_id
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/token/", 
                json=data, 
                auth=self.auth,
                headers={'Content-Type': 'application/json'}
            ) as response:
                response_body = await response.read()
                
                if response.status not in [200, 201]:
                    error_text = response_body.decode('utf-8')
                    raise Exception(f"Belvo API error {response.status}: {error_text}")
                
                result = json.loads(response_body.decode('utf-8'))
                return result['access']

    def _map_belvo_category(self, category: str) -> str:
        """
        Map Belvo transaction categories to our internal expense categories.
        
        STEP 4B of Belvo Connection Process - AI Categorization:
        =======================================================
        This method provides intelligent mapping between Belvo's raw transaction
        categories (which vary by bank) and our standardized expense categories
        used throughout the application.
        
        Category Mapping Strategy:
        1. Income transactions (INFLOW) are always mapped to 'Income'
        2. Expense transactions (OUTFLOW) are mapped based on keywords:
           - food/groceries/supermarket → Dining/Groceries
           - transport/gas/fuel → Transport
           - utilities → Utilities
           - entertainment → Entertainment
           - health/medical → Healthcare
           - shopping/transfer → Other (fallback)
        3. Unknown categories default to 'Other'
        
        This mapping ensures:
        - Consistent categorization across different banks
        - Proper budget tracking and expense analysis
        - Meaningful financial insights and reporting
        
        Args:
            category: Raw category from Belvo transaction data
            tx_type: Transaction type ('INFLOW' for income, 'OUTFLOW' for expenses)
            
        Returns:
            Standardized category string matching our expense categories
            
        Categories Used:
        - Income: All incoming transactions
        - Dining: Food and restaurant purchases
        - Groceries: Supermarket and food shopping
        - Transport: Transportation, gas, fuel
        - Utilities: Bills and utility payments
        - Entertainment: Entertainment and leisure
        - Healthcare: Medical and health expenses
        - Other: Fallback for unmatched categories
        """
        if not category:
            return 'Other'
        
        category_lower = category.lower()
        
        category_mapping = {
            'food': 'Dining',
            'groceries': 'Groceries',
            'supermarket': 'Groceries',
            'transport': 'Transport',
            'gas': 'Transport',
            'fuel': 'Transport',
            'utilities': 'Utilities',
            'entertainment': 'Entertainment',
            'health': 'Healthcare',
            'medical': 'Healthcare',
            'shopping': 'Other',
            'transfer': 'Other'
        }
        
        for key, value in category_mapping.items():
            if key in category_lower:
                return value
                
        return 'Other'
    
    async def convert_to_expenses(
        self, 
        transactions: List[BelvoTransaction]
    ) -> List[ExpenseCreate]:
        """
        Convert Belvo transactions to expense records.
        
        Converts both income and expense transactions:
        - INFLOW transactions → income type with 'Income' category
        - OUTFLOW transactions → expense type with mapped categories
        - Filters out transactions with unknown types or non-PROCESSED status
        """
        expenses = []
        
        for transaction in transactions:
            if transaction.status != 'PROCESSED':
                logger.info(f"Skipping transaction with status: {transaction.status} - {transaction.id} - {transaction.description}")
                continue

            # Map Belvo transaction types to our expense types
            if transaction.type == 'INFLOW':
                expense_type = ExpenseType.INCOME.value
            elif transaction.type == 'OUTFLOW':
                expense_type = ExpenseType.EXPENSE.value
            else:
                logger.info(f"Skipping transaction with unknown type: {transaction.type} - {transaction.id} - {transaction.description}")
                continue

            try:
                # Get current exchange rates for multi-currency support
                original_currency = Currency(transaction.currency)
                exchange_rates = await currency_service.get_current_rates()
                
                # Convert to all supported currencies
                amounts = await currency_service.convert_to_all_currencies(
                    transaction.amount, 
                    original_currency, 
                    exchange_rates
                )
                
                # Set category based on transaction type
                if expense_type == ExpenseType.INCOME.value:
                    category = 'Income'
                else:
                    category = self._map_belvo_category(transaction.category if transaction.category else '')

                merchant_name = "Unknown"
                if transaction.merchant and isinstance(transaction.merchant, dict):
                    merchant_name = transaction.merchant.get('name', 'Unknown')
  
                # Debug logging to check actual values
                source_value = ExpenseSource.AI_PROCESSED.value
                logger.info(f"Creating expense with type='{expense_type}', source='{source_value}'")
                
                expense = ExpenseCreate(
                    date=str(transaction.value_date.date()),
                    amount=transaction.amount,
                    category=category,
                    description=transaction.description or f"Belvo transaction {transaction.id[:8]}",
                    merchant=merchant_name,
                    type=expense_type,
                    source=source_value,
                    original_currency=transaction.currency,
                    amounts=amounts,
                    exchange_rates=exchange_rates,
                    exchange_date=str(datetime.now().date())
                )
                
                expenses.append(expense)
                
            except Exception as e:
                logger.warning(f"Failed to convert Belvo transaction {transaction.id} to expense: {e}")
                logger.debug(f"Failed transaction data: {transaction.dict()}")
                continue
        
        logger.info(f"Converted {len(expenses)} Belvo transactions to expenses from {len(transactions)} total transactions")
        return expenses
    
    async def get_transaction_by_id(self, transaction_id: str) -> Optional[BelvoTransaction]:
        """Get a specific transaction by ID for webhook processing."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/transactions/{transaction_id}/",
                    auth=self.auth,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status != 200:
                        logger.error(f"Failed to get transaction {transaction_id}: {response.status}")
                        return None
                    
                    result = await response.json()
                    
                    if self._is_valid_transaction(result):
                        return BelvoTransaction(
                            id=result['id'],
                            account=result.get('account', {}),
                            amount=abs(float(result['amount'])),
                            currency=result.get('currency', 'BRL'),
                            value_date=datetime.fromisoformat(result['value_date']),
                            description=result.get('description', ''),
                            category=result.get('category'),
                            type=result.get('type', 'OUTFLOW'),
                            merchant=result.get('merchant', {}),
                            status=result.get('status', 'PROCESSED'),
                            subcategory=result.get('subcategory'),
                            balance=result.get('balance'),
                            reference=result.get('reference')
                        )
                    return None
        except Exception as e:
            logger.error(f"Error fetching transaction {transaction_id}: {e}")
            return None
    
    async def get_all_transactions_paginated(self, link_id: str) -> List[BelvoTransaction]:
        """
        Get ALL transactions for a specific link using pagination.
        
        This method fetches all available transactions from Belvo using their paginated API.
        It handles the pagination automatically and returns all transactions.
        
        Args:
            link_id: The Belvo link identifier
            
        Returns:
            List of all BelvoTransaction objects
            
        Raises:
            Exception: If API request fails
        """
        all_transactions = []
        
        logger.info(f"Starting paginated transaction fetch for link {link_id}")
        
        try:
            async with aiohttp.ClientSession() as session:
                page = 1
                
                while True:
                    # Use GET request with query parameters as per Belvo API
                    url = f"{self.base_url}/api/transactions/?page={page}&link={link_id}"
                    
                    logger.info(f"Fetching page {page} from: {url}")
                    
                    async with session.get(
                        url,
                        auth=self.auth,
                        headers={'Content-Type': 'application/json'}
                    ) as response:
                        response_body = await response.read()
                        
                        if response.status != 200:
                            error_text = response_body.decode('utf-8')
                            logger.error(f"Failed to get transactions page {page}: {error_text}")
                            raise Exception(f"Failed to get transactions: {response.status}")
                        
                        result = json.loads(response_body.decode('utf-8'))
                        
                        # Handle Belvo's paginated response format
                        if isinstance(result, dict):
                            page_transactions = result.get('results', [])
                            has_next = result.get('next') is not None
                            total_count = result.get('count', 0)
                            
                            if page == 1:
                                logger.info(f"Total transactions available: {total_count}")
                        else:
                            # Fallback for unexpected format
                            logger.warning(f"Unexpected response format: {type(result)}")
                            page_transactions = result if isinstance(result, list) else []
                            has_next = False
                        
                        logger.info(f"Page {page}: Got {len(page_transactions)} transactions")
                        
                        # If no transactions on this page, we're done
                        if not page_transactions:
                            break
                        
                        # Convert to BelvoTransaction objects
                        for txn_data in page_transactions:
                            # Only process if it looks like a valid transaction
                            if self._is_valid_transaction(txn_data):
                                try:
                                    transaction = BelvoTransaction(
                                        id=txn_data['id'],
                                        account=txn_data.get('account', {}),
                                        amount=abs(float(txn_data['amount'])),
                                        currency=txn_data.get('currency', 'BRL'),
                                        value_date=datetime.fromisoformat(txn_data['value_date']),
                                        description=txn_data.get('description', ''),
                                        category=txn_data.get('category'),
                                        type=txn_data.get('type', 'OUTFLOW'),
                                        merchant=txn_data.get('merchant', {}),
                                        status=txn_data.get('status', 'PROCESSED'),
                                        subcategory=txn_data.get('subcategory'),
                                        balance=txn_data.get('balance'),
                                        reference=txn_data.get('reference')
                                    )
                                    all_transactions.append(transaction)
                                except Exception as txn_error:
                                    logger.warning(f"Failed to parse transaction {txn_data.get('id', 'unknown')}: {txn_error}")
                                    continue
                        
                        # Check if we should continue to next page
                        if not has_next:
                            break
                        
                        page += 1
                        
                        # Safety check to prevent infinite loops
                        if page > 100:  # Reasonable limit
                            logger.warning(f"Reached page limit (100) for link {link_id}")
                            break
            
            logger.info(f"Completed paginated fetch for link {link_id}: {len(all_transactions)} total transactions")
            return all_transactions
            
        except Exception as e:
            logger.error(f"Error in paginated transaction fetch for link {link_id}: {e}")
            raise
    
    def _is_valid_transaction(self, txn_data: Dict[str, Any]) -> bool:
        """Check if transaction data is valid and should be processed."""
        required_fields = ['id', 'amount', 'value_date', 'type']
        
        for field in required_fields:
            if field not in txn_data:
                logger.warning(f"Transaction missing required field {field}: {txn_data.get('id', 'unknown')}")
                return False
        
        # Check if amount is valid
        try:
            amount = float(txn_data['amount'])
            if amount <= 0:
                logger.warning(f"Transaction has invalid amount {amount}: {txn_data.get('id', 'unknown')}")
                return False
        except (ValueError, TypeError):
            logger.warning(f"Transaction has non-numeric amount: {txn_data.get('id', 'unknown')}")
            return False
        
        # Check if date is valid
        try:
            datetime.fromisoformat(txn_data['value_date'])
        except (ValueError, TypeError):
            logger.warning(f"Transaction has invalid date: {txn_data.get('id', 'unknown')}")
            return False
        
        return True
    
    async def get_transactions_async(self, link_id: str, save_data: bool = True) -> Dict[str, Any]:
        """Trigger asynchronous transaction fetch for a link.
        
        This method uses Belvo's asynchronous workflow to fetch transactions
        in the background. The response will be delivered via webhook.
        
        Args:
            link_id: The Belvo link identifier
            save_data: Whether to save data to Belvo's database (default: True)
            
        Returns:
            Dict containing request_id and status for tracking
            
        Raises:
            Exception: If API request fails or cooldown period is active
        """
        try:
            data = {
                "link": link_id,
                "save_data": save_data
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/transactions/",
                    json=data,
                    auth=self.auth,
                    headers={
                        'Content-Type': 'application/json',
                        'X-Belvo-Request-Mode': 'async'
                    }
                ) as response:
                    response_body = await response.read()
                    
                    if response.status == 202:
                        # Async request accepted
                        result = json.loads(response_body.decode('utf-8'))
                        logger.info(f"Async transaction request accepted for link {link_id}: {result.get('request_id')}")
                        return result
                        
                    elif response.status == 429:
                        # Rate limit or cooldown period
                        error_text = response_body.decode('utf-8')
                        logger.warning(f"Cooldown period active for link {link_id}: {error_text}")
                        raise Exception(f"Cooldown period active. Please wait before making another request.")
                        
                    else:
                        error_text = response_body.decode('utf-8')
                        logger.error(f"Failed to trigger async transactions for link {link_id}: {error_text}")
                        raise Exception(f"Belvo API error {response.status}: {error_text}")
                        
        except Exception as e:
            logger.error(f"Error triggering async transactions for link {link_id}: {e}")
            raise
    
    async def trigger_historical_update(self, link_id: str, resources: Optional[List[str]] = None) -> Dict[str, Any]:
        """Trigger historical data update for specific resources.
        
        This method can be used to request specific historical data types
        for an existing link using Belvo's asynchronous workflow.
        
        Args:
            link_id: The Belvo link identifier
            resources: List of resources to fetch (TRANSACTIONS, ACCOUNTS, etc.)
                      Defaults to ['TRANSACTIONS'] if not specified
            
        Returns:
            Dict containing request details and status
            
        Raises:
            Exception: If API request fails
        """
        if resources is None:
            resources = ['TRANSACTIONS']
            
        try:
            # Use widget token endpoint with historical fetch to trigger update
            data = {
                "link": link_id,
                "fetch_historical": True,
                "fetch_resources": resources
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/token/",
                    json=data,
                    auth=self.auth,
                    headers={
                        'Content-Type': 'application/json',
                        'X-Belvo-Request-Mode': 'async'
                    }
                ) as response:
                    response_body = await response.read()
                    
                    if response.status in [200, 202]:
                        result = json.loads(response_body.decode('utf-8'))
                        logger.info(f"Historical update triggered for link {link_id}, resources: {resources}")
                        return {
                            "request_id": result.get('request_id', 'unknown'),
                            "status": "accepted",
                            "resources": resources,
                            "link_id": link_id
                        }
                    else:
                        error_text = response_body.decode('utf-8')
                        logger.error(f"Failed to trigger historical update for link {link_id}: {error_text}")
                        raise Exception(f"Belvo API error {response.status}: {error_text}")
                        
        except Exception as e:
            logger.error(f"Error triggering historical update for link {link_id}: {e}")
            raise
    
    async def get_institutions(self) -> List[Dict[str, Any]]:
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
                        auth=self.auth,
                        headers={'Content-Type': 'application/json'}
                    ) as response:
                        response_body = await response.read()
                        
                        if response.status != 200:
                            error_text = response_body.decode('utf-8')
                            logger.error(f"Failed to get institutions page {page}: {error_text}")
                            raise Exception(f"Failed to get institutions: {response.status}")
                        
                        result = json.loads(response_body.decode('utf-8'))
                        
                        # Handle Belvo's paginated response format
                        if isinstance(result, dict):
                            page_institutions = result.get('results', [])
                            has_next = result.get('next') is not None
                            total_count = result.get('count', 0)
                            
                            if page == 1:
                                logger.info(f"Total institutions available: {total_count}")
                        else:
                            # Fallback for unexpected format
                            logger.warning(f"Unexpected response format: {type(result)}")
                            page_institutions = result if isinstance(result, list) else []
                            has_next = False
                        
                        logger.info(f"Page {page}: Got {len(page_institutions)} institutions")
                        
                        # Add institutions to our list
                        all_institutions.extend(page_institutions)
                        
                        # If no institutions on this page, we're done
                        if not page_institutions or not has_next:
                            break
                        
                        page += 1
                        
                        # Safety check to prevent infinite loops
                        if page > 100:  # Reasonable limit
                            logger.warning(f"Reached page limit (100) for institutions")
                            break
            
            logger.info(f"Completed institutions fetch: {len(all_institutions)} total institutions")
            return all_institutions
            
        except Exception as e:
            logger.error(f"Error fetching institutions from Belvo: {e}")
            raise
    
    def convert_institution_to_create_model(self, institution_data: Dict[str, Any]) -> Optional[BelvoInstitutionCreate]:
        """Convert Belvo institution data to our create model.
        
        Args:
            institution_data: Raw institution data from Belvo API
            
        Returns:
            BelvoInstitutionCreate model or None if data is invalid
        """
        try:
            # Extract required fields
            belvo_id = institution_data.get('id')
            name = institution_data.get('name', '')
            display_name = institution_data.get('display_name', name)
            code = institution_data.get('code', '')
            
            if not all([belvo_id, name, display_name, code]):
                logger.warning(f"Missing required fields in institution {belvo_id}: {institution_data.keys()}")
                return None
            
            # Map type (default to BANK if not specified)
            institution_type = institution_data.get('type', 'bank').upper()
            try:
                type_enum = BelvoInstitutionType(institution_type.lower())
            except ValueError:
                logger.warning(f"Unknown institution type '{institution_type}' for {belvo_id}, defaulting to BANK")
                type_enum = BelvoInstitutionType.BANK
            
            # Map status (default to HEALTHY if not specified)
            status_str = institution_data.get('status', 'healthy').upper()
            try:
                status_enum = BelvoInstitutionStatus(status_str.lower())
            except ValueError:
                logger.warning(f"Unknown institution status '{status_str}' for {belvo_id}, defaulting to HEALTHY")
                status_enum = BelvoInstitutionStatus.HEALTHY
            
            # Get country codes - use first one as primary
            country_codes = institution_data.get('country_codes', [])
            if not country_codes:
                logger.warning(f"No country codes for institution {belvo_id}")
                return None
            
            primary_country = country_codes[0] if country_codes else 'BR'
            
            # Get primary color (default to blue if not specified)
            primary_color = institution_data.get('primary_color', '#056dae')
            if not primary_color.startswith('#'):
                primary_color = f"#{primary_color}"
            
            return BelvoInstitutionCreate(
                belvo_id=belvo_id,
                name=name,
                display_name=display_name,
                code=code,
                type=type_enum,
                status=status_enum,
                country_code=primary_country,
                country_codes=country_codes,
                primary_color=primary_color,
                logo=institution_data.get('logo'),
                icon_logo=institution_data.get('icon_logo'),
                text_logo=institution_data.get('text_logo'),
                website=institution_data.get('website')
            )
            
        except Exception as e:
            logger.error(f"Error converting institution data {institution_data.get('id', 'unknown')}: {e}")
            return None
    


# Global instance
belvo_service = BelvoService()