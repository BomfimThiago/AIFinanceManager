"""
Integration module constants.

This module contains constants specific to the integrations functionality.
"""

from src.shared.constants import (
    ACCOUNT_TYPES,
    INTEGRATION_PROVIDERS,
    SYNC_DATA_TYPES,
    SYNC_FREQUENCIES,
    WEBHOOK_EVENT_TYPES,
    AccountType,
    IntegrationProvider,
    IntegrationStatus,
    SyncFrequency,
    SyncStatus,
    WebhookEventType,
)

# Re-export shared constants for convenience
__all__ = [
    "ACCOUNT_TYPES",
    "BELVO_CONSTANTS",
    "DEFAULT_SYNC_CONFIG",
    "ERROR_CODES",
    "INTEGRATION_PROVIDERS",
    "PLAID_CONSTANTS",
    "PROVIDER_CONFIGS",
    "STATUS_COLORS",
    "SYNC_DATA_TYPES",
    "SYNC_FREQUENCIES",
    "WEBHOOK_EVENT_TYPES",
    "AccountType",
    "IntegrationProvider",
    "IntegrationStatus",
    "SyncFrequency",
    "SyncStatus",
    "WebhookEventType",
]

# Provider-specific configurations
PROVIDER_CONFIGS: dict[str, dict[str, any]] = {
    IntegrationProvider.BELVO.value: {
        "name": "Belvo",
        "description": "Latin American banking data aggregator",
        "supported_countries": ["BR", "MX", "CO"],
        "supported_currencies": ["BRL", "MXN", "COP", "USD"],
        "supports_webhooks": True,
        "max_connections": 10,
        "widget_required": True,
        "oauth_flow": False,
    },
    IntegrationProvider.PLAID.value: {
        "name": "Plaid",
        "description": "North American banking data aggregator",
        "supported_countries": ["US", "CA", "GB", "FR", "ES", "NL", "IE"],
        "supported_currencies": ["USD", "CAD", "GBP", "EUR"],
        "supports_webhooks": True,
        "max_connections": 50,
        "widget_required": False,
        "oauth_flow": True,
    },
}

# Default sync configuration
DEFAULT_SYNC_CONFIG = {
    "frequency": SyncFrequency.DAILY.value,
    "auto_sync_enabled": True,
    "data_types": ["accounts", "transactions"],
    "webhook_enabled": True,
}

# Status color mappings for UI
STATUS_COLORS: dict[str, str] = {
    IntegrationStatus.PENDING.value: "#F59E0B",  # Orange
    IntegrationStatus.CONNECTING.value: "#3B82F6",  # Blue
    IntegrationStatus.CONNECTED.value: "#10B981",  # Green
    IntegrationStatus.ERROR.value: "#EF4444",  # Red
    IntegrationStatus.DISCONNECTED.value: "#6B7280",  # Gray
    IntegrationStatus.EXPIRED.value: "#DC2626",  # Dark red
    IntegrationStatus.MAINTENANCE.value: "#8B5CF6",  # Purple
}

# Belvo-specific constants
BELVO_CONSTANTS = {
    "sandbox_url": "https://sandbox.belvo.com",
    "production_url": "https://api.belvo.com",
    "widget_url": "https://widget.belvo.io",
    "consent_portal_url": "https://meuportal.belvo.com",
    "supported_institutions": [
        "bradesco_br_retail",
        "itau_br_retail",
        "santander_br_retail",
        "banco_do_brasil_br_retail",
        "caixa_br_retail",
    ],
    "webhook_events": [
        "new_transactions",
        "historical_update",
        "refresh_needed",
        "link_error",
    ],
    "rate_limits": {
        "requests_per_minute": 100,
        "requests_per_hour": 2000,
    },
}

# Plaid-specific constants
PLAID_CONSTANTS = {
    "sandbox_url": "https://sandbox.plaid.com",
    "development_url": "https://development.plaid.com",
    "production_url": "https://production.plaid.com",
    "supported_products": [
        "transactions",
        "accounts",
        "identity",
        "investments",
        "liabilities",
    ],
    "webhook_events": [
        "TRANSACTIONS",
        "ITEM",
        "INCOME",
        "ASSETS",
    ],
    "rate_limits": {
        "requests_per_minute": 600,
        "requests_per_hour": 10000,
    },
}

# Integration error codes
ERROR_CODES = {
    # General errors
    "PROVIDER_UNAVAILABLE": "Provider service is unavailable",
    "INVALID_CREDENTIALS": "Invalid authentication credentials",
    "RATE_LIMIT_EXCEEDED": "API rate limit exceeded",
    "QUOTA_EXCEEDED": "API quota exceeded",
    # Connection errors
    "CONNECTION_FAILED": "Failed to establish connection",
    "CONNECTION_TIMEOUT": "Connection timeout",
    "CONNECTION_REFUSED": "Connection refused by provider",
    "INVALID_INSTITUTION": "Invalid or unsupported institution",
    # Authentication errors
    "AUTH_EXPIRED": "Authentication token expired",
    "AUTH_REVOKED": "Authentication was revoked by user",
    "MFA_REQUIRED": "Multi-factor authentication required",
    "CREDENTIALS_INVALID": "Invalid login credentials",
    # Data errors
    "SYNC_FAILED": "Data synchronization failed",
    "PARSE_ERROR": "Failed to parse provider response",
    "VALIDATION_ERROR": "Data validation failed",
    "DUPLICATE_DATA": "Duplicate data detected",
    # Account errors
    "ACCOUNT_LOCKED": "Account is locked",
    "ACCOUNT_CLOSED": "Account is closed",
    "INSUFFICIENT_PERMISSIONS": "Insufficient permissions",
    "CONSENT_EXPIRED": "User consent has expired",
    # Provider-specific errors
    "BELVO_LINK_ERROR": "Belvo link connection error",
    "BELVO_INSTITUTION_DOWN": "Belvo institution temporarily unavailable",
    "PLAID_ITEM_ERROR": "Plaid item error",
    "PLAID_WEBHOOK_ERROR": "Plaid webhook processing error",
}

# Sync operation types
SYNC_TYPES = {
    "FULL": "full",
    "INCREMENTAL": "incremental",
    "ACCOUNTS": "accounts",
    "TRANSACTIONS": "transactions",
    "BALANCES": "balances",
}

# Webhook verification headers
WEBHOOK_HEADERS = {
    "BELVO_SIGNATURE": "belvo-signature",
    "PLAID_VERIFICATION": "plaid-verification",
}

# Institution categories
INSTITUTION_CATEGORIES = {
    "RETAIL_BANK": "retail_bank",
    "COMMERCIAL_BANK": "commercial_bank",
    "CREDIT_UNION": "credit_union",
    "INVESTMENT": "investment",
    "INSURANCE": "insurance",
    "OTHER": "other",
}

# Connection methods
CONNECTION_METHODS = {
    "CREDENTIALS": "credentials",
    "OAUTH": "oauth",
    "API_KEY": "api_key",
    "CERTIFICATE": "certificate",
}

# Data freshness levels
DATA_FRESHNESS = {
    "REAL_TIME": "real_time",  # < 1 minute
    "FRESH": "fresh",  # < 1 hour
    "RECENT": "recent",  # < 24 hours
    "STALE": "stale",  # > 24 hours
    "VERY_STALE": "very_stale",  # > 7 days
}

# Retry configurations
RETRY_CONFIG = {
    "max_retries": 3,
    "backoff_factor": 2,
    "retry_statuses": [500, 502, 503, 504, 429],
    "timeout_seconds": 30,
}
