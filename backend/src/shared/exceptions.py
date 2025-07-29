"""
Shared exceptions used across the application.

This module contains base exception classes and common exceptions
that are used by multiple modules.
"""

from typing import Any


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str = "An error occurred",
        details: dict[str, Any] | None = None,
        error_code: str | None = None,
    ):
        self.message = message
        self.details = details or {}
        self.error_code = error_code
        super().__init__(self.message)


class ValidationError(AppException):
    """Raised when data validation fails."""

    def __init__(
        self, message: str = "Validation failed", field: str | None = None, **kwargs
    ):
        details = kwargs.get("details", {})
        if field:
            details["field"] = field
        super().__init__(message, details, "VALIDATION_ERROR")


class NotFoundError(AppException):
    """Raised when a resource is not found."""

    def __init__(
        self, resource: str = "Resource", resource_id: Any | None = None, **kwargs
    ):
        message = f"{resource} not found"
        if resource_id:
            message += f" with ID: {resource_id}"

        details = kwargs.get("details", {})
        details.update(
            {
                "resource": resource,
                "resource_id": str(resource_id) if resource_id else None,
            }
        )

        super().__init__(message, details, "NOT_FOUND")


class DuplicateError(AppException):
    """Raised when attempting to create a duplicate resource."""

    def __init__(
        self,
        resource: str = "Resource",
        field: str | None = None,
        value: Any | None = None,
        **kwargs,
    ):
        message = f"{resource} already exists"
        if field and value:
            message += f" with {field}: {value}"

        details = kwargs.get("details", {})
        details.update(
            {
                "resource": resource,
                "field": field,
                "value": str(value) if value else None,
            }
        )

        super().__init__(message, details, "DUPLICATE_ERROR")


class PermissionError(AppException):
    """Raised when user doesn't have permission for an action."""

    def __init__(
        self, action: str = "perform this action", resource: str | None = None, **kwargs
    ):
        message = f"Permission denied to {action}"
        if resource:
            message += f" on {resource}"

        details = kwargs.get("details", {})
        details.update({"action": action, "resource": resource})

        super().__init__(message, details, "PERMISSION_DENIED")


class ExternalServiceError(AppException):
    """Raised when external service call fails."""

    def __init__(
        self,
        service: str,
        operation: str = "operation",
        status_code: int | None = None,
        **kwargs,
    ):
        message = f"{service} {operation} failed"
        if status_code:
            message += f" (status: {status_code})"

        details = kwargs.get("details", {})
        details.update(
            {"service": service, "operation": operation, "status_code": status_code}
        )

        super().__init__(message, details, "EXTERNAL_SERVICE_ERROR")


class DatabaseError(AppException):
    """Raised when database operation fails."""

    def __init__(
        self, operation: str = "Database operation", table: str | None = None, **kwargs
    ):
        message = f"{operation} failed"
        if table:
            message += f" on table {table}"

        details = kwargs.get("details", {})
        details.update({"operation": operation, "table": table})

        super().__init__(message, details, "DATABASE_ERROR")


class AuthenticationError(AppException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed", **kwargs):
        super().__init__(message, kwargs.get("details", {}), "AUTHENTICATION_ERROR")


class AuthorizationError(AppException):
    """Raised when authorization fails."""

    def __init__(self, message: str = "Authorization failed", **kwargs):
        super().__init__(message, kwargs.get("details", {}), "AUTHORIZATION_ERROR")


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""

    def __init__(self, resource: str = "API", retry_after: int | None = None, **kwargs):
        message = f"Rate limit exceeded for {resource}"
        if retry_after:
            message += f". Retry after {retry_after} seconds"

        details = kwargs.get("details", {})
        details.update({"resource": resource, "retry_after": retry_after})

        super().__init__(message, details, "RATE_LIMIT_EXCEEDED")


class ConfigurationError(AppException):
    """Raised when configuration is invalid."""

    def __init__(
        self, setting: str | None = None, message: str = "Configuration error", **kwargs
    ):
        if setting:
            message = f"Invalid configuration for {setting}"

        details = kwargs.get("details", {})
        if setting:
            details["setting"] = setting

        super().__init__(message, details, "CONFIGURATION_ERROR")
