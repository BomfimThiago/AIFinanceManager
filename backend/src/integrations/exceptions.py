"""
Integration module exceptions.

This module contains exceptions specific to the integrations functionality.
"""

from src.shared.exceptions import AppException, ExternalServiceError, NotFoundError


class IntegrationError(AppException):
    """Base integration exception."""

    def __init__(
        self,
        message: str = "Integration error occurred",
        provider: str | None = None,
        integration_id: int | None = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        details.update({"provider": provider, "integration_id": integration_id})
        super().__init__(message, details, "INTEGRATION_ERROR")


class IntegrationNotFound(NotFoundError):
    """Raised when integration is not found."""

    def __init__(self, integration_id: int | None = None, **kwargs):
        super().__init__(resource="Integration", resource_id=integration_id, **kwargs)


class ProviderUnavailable(ExternalServiceError):
    """Raised when integration provider is unavailable."""

    def __init__(self, message: str, provider: str | None = None, **kwargs):
        details = kwargs.get("details", {})
        if provider:
            details["provider"] = provider

        super().__init__(
            service="Integration Provider", operation=message, details=details, **kwargs
        )


class ConnectionError(IntegrationError):
    """Raised when connection to provider fails."""

    def __init__(
        self,
        provider: str,
        institution_id: str | None = None,
        reason: str = "Connection failed",
        **kwargs,
    ):
        message = f"Connection to {provider} failed"
        if institution_id:
            message += f" for institution {institution_id}"

        details = kwargs.get("details", {})
        details.update(
            {"provider": provider, "institution_id": institution_id, "reason": reason}
        )

        super().__init__(message, provider=provider, details=details)


class AuthenticationError(IntegrationError):
    """Raised when authentication with provider fails."""

    def __init__(self, provider: str, reason: str = "Authentication failed", **kwargs):
        message = f"Authentication with {provider} failed: {reason}"
        super().__init__(
            message, provider=provider, error_code="AUTHENTICATION_ERROR", **kwargs
        )


class SyncError(IntegrationError):
    """Raised when data synchronization fails."""

    def __init__(
        self,
        provider: str,
        data_type: str,
        reason: str = "Sync failed",
        integration_id: int | None = None,
        **kwargs,
    ):
        message = f"Sync failed for {provider} {data_type}: {reason}"
        details = kwargs.get("details", {})
        details.update({"data_type": data_type, "reason": reason})

        super().__init__(
            message,
            provider=provider,
            integration_id=integration_id,
            error_code="SYNC_ERROR",
            details=details,
        )


class SyncFailed(SyncError):
    """Raised when sync operation fails completely."""

    pass


class WebhookError(IntegrationError):
    """Raised when webhook processing fails."""

    def __init__(
        self,
        provider: str,
        event_type: str,
        reason: str = "Webhook processing failed",
        **kwargs,
    ):
        message = f"Webhook processing failed for {provider} {event_type}: {reason}"
        details = kwargs.get("details", {})
        details.update({"event_type": event_type, "reason": reason})

        super().__init__(
            message, provider=provider, error_code="WEBHOOK_ERROR", details=details
        )


class RateLimitExceeded(IntegrationError):
    """Raised when provider rate limit is exceeded."""

    def __init__(self, provider: str, retry_after: int | None = None, **kwargs):
        message = f"Rate limit exceeded for {provider}"
        if retry_after:
            message += f". Retry after {retry_after} seconds"

        details = kwargs.get("details", {})
        details.update({"retry_after": retry_after})

        super().__init__(
            message,
            provider=provider,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details,
        )


class QuotaExceeded(IntegrationError):
    """Raised when provider quota is exceeded."""

    def __init__(
        self,
        provider: str,
        quota_type: str = "requests",
        reset_date: str | None = None,
        **kwargs,
    ):
        message = f"{quota_type.title()} quota exceeded for {provider}"
        if reset_date:
            message += f". Resets on {reset_date}"

        details = kwargs.get("details", {})
        details.update({"quota_type": quota_type, "reset_date": reset_date})

        super().__init__(
            message, provider=provider, error_code="QUOTA_EXCEEDED", details=details
        )


class ConsentExpired(IntegrationError):
    """Raised when user consent has expired."""

    def __init__(
        self,
        provider: str,
        integration_id: int | None = None,
        expiry_date: str | None = None,
        **kwargs,
    ):
        message = f"User consent expired for {provider}"
        if expiry_date:
            message += f" on {expiry_date}"

        details = kwargs.get("details", {})
        details.update({"expiry_date": expiry_date})

        super().__init__(
            message,
            provider=provider,
            integration_id=integration_id,
            error_code="CONSENT_EXPIRED",
            details=details,
        )


class InstitutionError(IntegrationError):
    """Raised when there's an issue with the institution."""

    def __init__(
        self,
        provider: str,
        institution_id: str,
        reason: str = "Institution error",
        **kwargs,
    ):
        message = f"Institution error for {provider} {institution_id}: {reason}"
        details = kwargs.get("details", {})
        details.update({"institution_id": institution_id, "reason": reason})

        super().__init__(
            message, provider=provider, error_code="INSTITUTION_ERROR", details=details
        )


class BelvoError(IntegrationError):
    """Belvo-specific errors."""

    def __init__(
        self,
        message: str,
        error_code: str | None = None,
        link_id: str | None = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        details.update({"link_id": link_id, "belvo_error_code": error_code})

        super().__init__(
            message,
            provider="belvo",
            error_code=error_code or "BELVO_ERROR",
            details=details,
        )


class PlaidError(IntegrationError):
    """Plaid-specific errors."""

    def __init__(
        self,
        message: str,
        error_code: str | None = None,
        item_id: str | None = None,
        **kwargs,
    ):
        details = kwargs.get("details", {})
        details.update({"item_id": item_id, "plaid_error_code": error_code})

        super().__init__(
            message,
            provider="plaid",
            error_code=error_code or "PLAID_ERROR",
            details=details,
        )


class DataValidationError(IntegrationError):
    """Raised when provider data validation fails."""

    def __init__(
        self, provider: str, data_type: str, validation_errors: list, **kwargs
    ):
        message = f"Data validation failed for {provider} {data_type}"
        details = kwargs.get("details", {})
        details.update({"data_type": data_type, "validation_errors": validation_errors})

        super().__init__(
            message,
            provider=provider,
            error_code="DATA_VALIDATION_ERROR",
            details=details,
        )


class MappingError(IntegrationError):
    """Raised when data mapping fails."""

    def __init__(
        self,
        provider: str,
        source_field: str,
        target_field: str,
        reason: str = "Mapping failed",
        **kwargs,
    ):
        message = (
            f"Failed to map {source_field} to {target_field} for {provider}: {reason}"
        )
        details = kwargs.get("details", {})
        details.update(
            {
                "source_field": source_field,
                "target_field": target_field,
                "reason": reason,
            }
        )

        super().__init__(
            message, provider=provider, error_code="MAPPING_ERROR", details=details
        )
