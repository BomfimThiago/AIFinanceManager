"""
Auth module exceptions.

This module contains custom exceptions for authentication and authorization
errors in the auth module.
"""

from typing import Any

from src.shared.exceptions import AppException


class AuthException(AppException):
    """Base exception for authentication errors."""

    def __init__(
        self,
        message: str = "Authentication error",
        details: dict[str, Any] | None = None,
        error_code: str | None = None,
    ):
        super().__init__(message, details, error_code)


class AuthenticationError(AuthException):
    """Exception for authentication failures."""

    def __init__(
        self,
        message: str = "Authentication failed",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "AUTHENTICATION_FAILED")


class AuthorizationError(AuthException):
    """Exception for authorization failures."""

    def __init__(
        self,
        message: str = "Authorization failed",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "AUTHORIZATION_FAILED")


class InvalidTokenError(AuthException):
    """Exception for invalid or expired tokens."""

    def __init__(
        self,
        message: str = "Invalid or expired token",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "INVALID_TOKEN")


class UserNotFoundError(AuthException):
    """Exception for user not found errors."""

    def __init__(
        self, message: str = "User not found", details: dict[str, Any] | None = None
    ):
        super().__init__(message, details, "USER_NOT_FOUND")


class UserAlreadyExistsError(AuthException):
    """Exception for user already exists errors."""

    def __init__(
        self,
        message: str = "User already exists",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "USER_ALREADY_EXISTS")


class InvalidCredentialsError(AuthException):
    """Exception for invalid login credentials."""

    def __init__(
        self,
        message: str = "Invalid credentials",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "INVALID_CREDENTIALS")


class InactiveUserError(AuthException):
    """Exception for inactive user access attempts."""

    def __init__(
        self,
        message: str = "User account is inactive",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "INACTIVE_USER")


class UnverifiedUserError(AuthException):
    """Exception for unverified user access attempts."""

    def __init__(
        self,
        message: str = "User account is not verified",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "UNVERIFIED_USER")


class PasswordValidationError(AuthException):
    """Exception for password validation failures."""

    def __init__(
        self,
        message: str = "Password validation failed",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "PASSWORD_VALIDATION_FAILED")


class InsufficientPermissionsError(AuthException):
    """Exception for insufficient permissions."""

    def __init__(
        self,
        message: str = "Insufficient permissions",
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message, details, "INSUFFICIENT_PERMISSIONS")
