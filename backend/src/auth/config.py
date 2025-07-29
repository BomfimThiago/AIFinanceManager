"""
Auth module configuration.

This module contains authentication-specific configuration settings
using the global application configuration.
"""

from datetime import timedelta

from src.config import settings


class AuthConfig:
    """Authentication configuration based on global settings."""

    @property
    def JWT_SECRET_KEY(self) -> str:
        """JWT secret key from global settings."""
        return settings.SECRET_KEY

    @property
    def JWT_ALGORITHM(self) -> str:
        """JWT algorithm from global settings."""
        return settings.ALGORITHM

    @property
    def JWT_ACCESS_TOKEN_EXPIRE_MINUTES(self) -> int:
        """JWT access token expiration from global settings."""
        return settings.ACCESS_TOKEN_EXPIRE_MINUTES

    @property
    def JWT_REFRESH_TOKEN_EXPIRE_DAYS(self) -> int:
        """JWT refresh token expiration (default 7 days)."""
        return 7

    # Password Configuration
    PASSWORD_MIN_LENGTH: int = 6
    PASSWORD_MAX_LENGTH: int = 100

    # User Configuration
    USERNAME_MIN_LENGTH: int = 3
    USERNAME_MAX_LENGTH: int = 50
    FULL_NAME_MAX_LENGTH: int = 100

    # Account Configuration
    REQUIRE_EMAIL_VERIFICATION: bool = False
    ALLOW_REGISTRATION: bool = True

    @property
    def access_token_expire_delta(self) -> timedelta:
        """Get access token expiration as timedelta."""
        return timedelta(minutes=self.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    @property
    def refresh_token_expire_delta(self) -> timedelta:
        """Get refresh token expiration as timedelta."""
        return timedelta(days=self.JWT_REFRESH_TOKEN_EXPIRE_DAYS)


# Global auth settings instance
auth_settings = AuthConfig()
