"""
Shared constants used across the application.

This module contains constants that are used by multiple modules
throughout the application.
"""

from enum import Enum


class Environment(str, Enum):
    """Application environment."""

    LOCAL = "local"
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Currency(str, Enum):
    """Supported currencies."""

    USD = "USD"
    EUR = "EUR"
    BRL = "BRL"


class ExpenseSource(str, Enum):
    """Source of expense data."""

    MANUAL = "manual"
    RECEIPT_UPLOAD = "receipt_upload"
    BELVO_INTEGRATION = "belvo_integration"
    PLAID_INTEGRATION = "plaid_integration"


class ExpenseCategory(str, Enum):
    """Expense categories."""

    FOOD = "food"
    TRANSPORT = "transport"
    UTILITIES = "utilities"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    SHOPPING = "shopping"
    EDUCATION = "education"
    TRAVEL = "travel"
    BUSINESS = "business"
    OTHER = "other"


class BudgetPeriod(str, Enum):
    """Budget period types."""

    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class IntegrationProvider(str, Enum):
    """Integration providers."""

    BELVO = "belvo"
    PLAID = "plaid"


class IntegrationStatus(str, Enum):
    """Integration status values."""

    PENDING = "pending"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"
    DISCONNECTED = "disconnected"
    EXPIRED = "expired"
    MAINTENANCE = "maintenance"


class SyncStatus(str, Enum):
    """Sync operation status."""

    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    IN_PROGRESS = "in_progress"


class SyncFrequency(str, Enum):
    """Sync frequency options."""

    MANUAL = "manual"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


class AccountType(str, Enum):
    """Bank account types."""

    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT_CARD = "credit_card"
    INVESTMENT = "investment"
    LOAN = "loan"
    MORTGAGE = "mortgage"
    OTHER = "other"


class WebhookEventType(str, Enum):
    """Webhook event types."""

    NEW_TRANSACTIONS = "new_transactions"
    HISTORICAL_UPDATE = "historical_update"
    ACCOUNT_UPDATE = "account_update"
    REFRESH_NEEDED = "refresh_needed"
    ERROR = "error"


class InsightType(str, Enum):
    """AI insight types."""

    WARNING = "warning"
    SUCCESS = "success"
    INFO = "info"


# API Constants
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Currency format
CURRENCY_SYMBOLS = {Currency.USD: "$", Currency.EUR: "€", Currency.BRL: "R$"}

# Expense categories with icons
EXPENSE_CATEGORY_ICONS = {
    ExpenseCategory.FOOD: "🍽️",
    ExpenseCategory.TRANSPORT: "🚗",
    ExpenseCategory.UTILITIES: "💡",
    ExpenseCategory.ENTERTAINMENT: "🎬",
    ExpenseCategory.HEALTHCARE: "🏥",
    ExpenseCategory.SHOPPING: "🛍️",
    ExpenseCategory.EDUCATION: "📚",
    ExpenseCategory.TRAVEL: "✈️",
    ExpenseCategory.BUSINESS: "💼",
    ExpenseCategory.OTHER: "📝",
}

# Integration provider configurations
INTEGRATION_PROVIDERS = [IntegrationProvider.BELVO, IntegrationProvider.PLAID]

SYNC_FREQUENCIES = [
    SyncFrequency.MANUAL,
    SyncFrequency.HOURLY,
    SyncFrequency.DAILY,
    SyncFrequency.WEEKLY,
]

SYNC_DATA_TYPES = ["accounts", "transactions", "balances", "investments", "loans"]

ACCOUNT_TYPES = [
    AccountType.CHECKING,
    AccountType.SAVINGS,
    AccountType.CREDIT_CARD,
    AccountType.INVESTMENT,
    AccountType.LOAN,
    AccountType.MORTGAGE,
    AccountType.OTHER,
]

WEBHOOK_EVENT_TYPES = [
    WebhookEventType.NEW_TRANSACTIONS,
    WebhookEventType.HISTORICAL_UPDATE,
    WebhookEventType.ACCOUNT_UPDATE,
    WebhookEventType.REFRESH_NEEDED,
    WebhookEventType.ERROR,
]
