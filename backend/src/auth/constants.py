"""
Auth module constants.

This module contains constants used throughout the auth module
for user roles, permissions, and other auth-related values.
"""

from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    USER = "user"
    MODERATOR = "moderator"


class Permission(str, Enum):
    """Permission enumeration."""

    # User permissions
    USER_READ = "user:read"
    USER_WRITE = "user:write"
    USER_DELETE = "user:delete"

    # Integration permissions
    INTEGRATION_READ = "integration:read"
    INTEGRATION_WRITE = "integration:write"
    INTEGRATION_DELETE = "integration:delete"
    INTEGRATION_SYNC = "integration:sync"

    # Admin permissions
    ADMIN_READ = "admin:read"
    ADMIN_WRITE = "admin:write"
    ADMIN_DELETE = "admin:delete"


class TokenType(str, Enum):
    """Token type enumeration."""

    ACCESS = "access"
    REFRESH = "refresh"
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"


# Default role permissions mapping
ROLE_PERMISSIONS = {
    UserRole.ADMIN: [
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.USER_DELETE,
        Permission.INTEGRATION_READ,
        Permission.INTEGRATION_WRITE,
        Permission.INTEGRATION_DELETE,
        Permission.INTEGRATION_SYNC,
        Permission.ADMIN_READ,
        Permission.ADMIN_WRITE,
        Permission.ADMIN_DELETE,
    ],
    UserRole.MODERATOR: [
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.INTEGRATION_READ,
        Permission.INTEGRATION_WRITE,
        Permission.INTEGRATION_DELETE,
        Permission.INTEGRATION_SYNC,
    ],
    UserRole.USER: [
        Permission.USER_READ,
        Permission.INTEGRATION_READ,
        Permission.INTEGRATION_WRITE,
        Permission.INTEGRATION_DELETE,
        Permission.INTEGRATION_SYNC,
    ],
}

# OAuth2 settings
OAUTH2_TOKEN_URL = "api/auth/login"
OAUTH2_SCOPES = {
    "read": "Read access to user data",
    "write": "Write access to user data",
    "admin": "Administrative access",
}

# Password validation constants
PASSWORD_MIN_LENGTH = 6
PASSWORD_MAX_LENGTH = 100
REQUIRE_UPPERCASE = False
REQUIRE_LOWERCASE = False
REQUIRE_NUMBERS = False
REQUIRE_SPECIAL_CHARS = False
