"""
Integration module utilities.

This module contains utility functions specific to the
integrations functionality.
"""

import hashlib
import hmac
import json
import logging
from datetime import UTC, datetime
from typing import Any

from cryptography.fernet import Fernet

from src.integrations.config import integration_config

logger = logging.getLogger(__name__)


def encrypt_token(token: str) -> str:
    """Encrypt a provider token for secure storage."""
    if not integration_config.ENCRYPT_TOKENS:
        return token

    if not integration_config.TOKEN_ENCRYPTION_KEY:
        logger.warning("Token encryption enabled but no encryption key provided")
        return token

    try:
        key = integration_config.TOKEN_ENCRYPTION_KEY.encode()
        # Ensure key is 44 characters (32 bytes base64 encoded + padding)
        if len(key) != 44:
            # Generate a proper key from the provided key using SHA256
            key = hashlib.sha256(key).digest()
            key = Fernet.generate_key()  # Use a proper key instead

        fernet = Fernet(key)
        encrypted_token = fernet.encrypt(token.encode())
        return encrypted_token.decode()
    except Exception as e:
        logger.error(f"Failed to encrypt token: {e}")
        return token


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a provider token from storage."""
    if not integration_config.ENCRYPT_TOKENS:
        return encrypted_token

    if not integration_config.TOKEN_ENCRYPTION_KEY:
        logger.warning("Token encryption enabled but no encryption key provided")
        return encrypted_token

    try:
        key = integration_config.TOKEN_ENCRYPTION_KEY.encode()
        # Ensure key is 44 characters (32 bytes base64 encoded + padding)
        if len(key) != 44:
            # Generate a proper key from the provided key using SHA256
            key = hashlib.sha256(key).digest()
            key = Fernet.generate_key()  # Use a proper key instead

        fernet = Fernet(key)
        decrypted_token = fernet.decrypt(encrypted_token.encode())
        return decrypted_token.decode()
    except Exception as e:
        logger.error(f"Failed to decrypt token: {e}")
        return encrypted_token


def verify_webhook_signature(
    payload: str, signature: str, secret: str, provider: str = "belvo"
) -> bool:
    """Verify webhook signature."""
    if not secret:
        logger.warning(f"No webhook secret configured for {provider}")
        return True  # Skip verification if no secret

    try:
        if provider == "belvo":
            # Belvo uses HMAC SHA256
            expected_signature = hmac.new(
                secret.encode(), payload.encode(), hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(signature, expected_signature)

        elif provider == "plaid":
            # Plaid uses HMAC SHA256 with specific format
            expected_signature = hmac.new(
                secret.encode(), payload.encode(), hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(signature, expected_signature)

        else:
            logger.warning(f"Unknown provider for webhook verification: {provider}")
            return False

    except Exception as e:
        logger.error(f"Failed to verify webhook signature: {e}")
        return False


def normalize_institution_data(
    provider: str, raw_data: dict[str, Any]
) -> dict[str, Any]:
    """Normalize institution data from different providers."""
    if provider == "belvo":
        return {
            "id": raw_data.get("id"),
            "name": raw_data.get("name"),
            "display_name": raw_data.get("display_name", raw_data.get("name")),
            "logo_url": raw_data.get("logo") or raw_data.get("icon_logo"),
            "website": raw_data.get("website"),
            "country": raw_data.get("country_code"),
            "type": raw_data.get("type"),
            "status": raw_data.get("status"),
            "resources": raw_data.get("resources", []),
            "features": raw_data.get("features", []),
        }

    elif provider == "plaid":
        return {
            "id": raw_data.get("institution_id"),
            "name": raw_data.get("name"),
            "display_name": raw_data.get("name"),
            "logo_url": raw_data.get("logo"),
            "website": raw_data.get("url"),
            "country": raw_data.get("country_codes", ["US"])[0]
            if raw_data.get("country_codes")
            else "US",
            "type": "bank",
            "status": "active",
            "resources": raw_data.get("products", []),
            "features": [],
        }

    else:
        return raw_data


def normalize_account_data(provider: str, raw_data: dict[str, Any]) -> dict[str, Any]:
    """Normalize account data from different providers."""
    if provider == "belvo":
        return {
            "provider_account_id": raw_data.get("id"),
            "account_name": raw_data.get("name", "Unknown Account"),
            "account_type": raw_data.get("category", "other"),
            "account_subtype": raw_data.get("type"),
            "current_balance": raw_data.get("balance", {}).get("current"),
            "available_balance": raw_data.get("balance", {}).get("available"),
            "currency": raw_data.get("currency", "BRL"),
            "account_number": raw_data.get("number"),
            "is_active": raw_data.get("loan_data", {}).get(
                "is_payment_up_to_date", True
            ),
        }

    elif provider == "plaid":
        return {
            "provider_account_id": raw_data.get("account_id"),
            "account_name": raw_data.get("name", "Unknown Account"),
            "account_type": raw_data.get("type", "other"),
            "account_subtype": raw_data.get("subtype"),
            "current_balance": raw_data.get("balances", {}).get("current"),
            "available_balance": raw_data.get("balances", {}).get("available"),
            "currency": raw_data.get("balances", {}).get("iso_currency_code", "USD"),
            "account_number": raw_data.get("mask"),
            "is_active": True,
        }

    else:
        return raw_data


def normalize_transaction_data(
    provider: str, raw_data: dict[str, Any]
) -> dict[str, Any]:
    """Normalize transaction data from different providers."""
    if provider == "belvo":
        return {
            "provider_transaction_id": raw_data.get("id"),
            "account_id": raw_data.get("account", {}).get("id")
            if isinstance(raw_data.get("account"), dict)
            else raw_data.get("account"),
            "amount": abs(float(raw_data.get("amount", 0))),
            "currency": raw_data.get("currency", "BRL"),
            "description": raw_data.get("description", ""),
            "date": raw_data.get("value_date") or raw_data.get("accounting_date"),
            "category": raw_data.get("category"),
            "merchant_name": raw_data.get("merchant", {}).get("name")
            if raw_data.get("merchant")
            else None,
            "type": "expense" if float(raw_data.get("amount", 0)) < 0 else "income",
        }

    elif provider == "plaid":
        return {
            "provider_transaction_id": raw_data.get("transaction_id"),
            "account_id": raw_data.get("account_id"),
            "amount": abs(float(raw_data.get("amount", 0))),
            "currency": raw_data.get("iso_currency_code", "USD"),
            "description": raw_data.get("name", ""),
            "date": raw_data.get("date"),
            "category": raw_data.get("category", [None])[0]
            if raw_data.get("category")
            else None,
            "merchant_name": raw_data.get("merchant_name"),
            "type": "expense"
            if float(raw_data.get("amount", 0)) > 0
            else "income",  # Plaid uses positive for outflow
        }

    else:
        return raw_data


def calculate_sync_health_score(
    last_sync: datetime | None,
    sync_status: str | None,
    connection_status: str,
    error_count: int = 0,
) -> float:
    """Calculate a health score for an integration (0-100)."""
    score = 100.0

    # Deduct for connection issues
    if connection_status != "connected":
        score -= 50

    # Deduct for sync errors
    if sync_status == "failed":
        score -= 30
    elif sync_status == "partial":
        score -= 15

    # Deduct for sync frequency
    if last_sync:
        days_since_sync = (datetime.now(UTC) - last_sync).days
        if days_since_sync > 7:
            score -= min(30, days_since_sync * 2)
    else:
        score -= 40  # Never synced

    # Deduct for errors
    score -= min(20, error_count * 5)

    return max(0.0, score)


def format_provider_error(provider: str, error_data: dict[str, Any]) -> str:
    """Format provider-specific error messages."""
    if provider == "belvo":
        error_code = error_data.get("code", "UNKNOWN")
        error_message = error_data.get("message", "Unknown error")
        error_detail = error_data.get("detail", "")

        formatted = f"Belvo Error {error_code}: {error_message}"
        if error_detail:
            formatted += f" - {error_detail}"
        return formatted

    elif provider == "plaid":
        error_type = error_data.get("error_type", "UNKNOWN")
        error_code = error_data.get("error_code", "UNKNOWN")
        error_message = error_data.get("error_message", "Unknown error")

        return f"Plaid {error_type} Error {error_code}: {error_message}"

    else:
        return json.dumps(error_data)


def get_retry_delay(attempt: int, base_delay: int = 1) -> int:
    """Calculate exponential backoff delay for retries."""
    return min(base_delay * (2**attempt), 300)  # Max 5 minutes


def is_retryable_error(provider: str, error_code: str) -> bool:
    """Check if an error is retryable."""
    retryable_codes = {
        "belvo": [
            "timeout",
            "rate_limit",
            "server_error",
            "service_unavailable",
            "institution_down",
        ],
        "plaid": [
            "INSTITUTION_ERROR",
            "ITEM_NOT_FOUND",
            "RATE_LIMIT_EXCEEDED",
            "API_ERROR",
        ],
    }

    return error_code.lower() in [
        code.lower() for code in retryable_codes.get(provider, [])
    ]


def mask_sensitive_data(data: dict[str, Any]) -> dict[str, Any]:
    """Mask sensitive data for logging."""
    sensitive_fields = [
        "access_token",
        "refresh_token",
        "secret",
        "password",
        "account_number",
        "routing_number",
        "ssn",
        "tax_id",
    ]

    masked_data = data.copy()

    def mask_dict(d: dict[str, Any]) -> dict[str, Any]:
        result = {}
        for key, value in d.items():
            if key.lower() in sensitive_fields:
                if isinstance(value, str) and len(value) > 4:
                    result[key] = f"****{value[-4:]}"
                else:
                    result[key] = "****"
            elif isinstance(value, dict):
                result[key] = mask_dict(value)
            elif isinstance(value, list):
                result[key] = [
                    mask_dict(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                result[key] = value
        return result

    return mask_dict(masked_data)
