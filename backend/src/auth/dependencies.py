"""
Auth dependencies module.

This module contains FastAPI dependencies for authentication
and authorization, including current user extraction and permission checks.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.constants import Permission, UserRole
from src.auth.exceptions import (
    AuthenticationError,
    InactiveUserError,
    InvalidTokenError,
    UserNotFoundError,
)
from src.auth.schemas import User
from src.auth.service import AuthService
from src.database import get_database_session

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


async def get_auth_service(
    session: AsyncSession = Depends(get_database_session),
) -> AuthService:
    """Get auth service dependency."""
    return AuthService(session)


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User | None:
    """Get current user from bearer token (optional)."""
    if not credentials:
        return None

    try:
        token = credentials.credentials
        return await auth_service.get_current_user(token)
    except (
        InvalidTokenError,
        AuthenticationError,
        UserNotFoundError,
        InactiveUserError,
    ):
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Get current user from bearer token (required)."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        token = credentials.credentials
        return await auth_service.get_current_user(token)
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
    except InactiveUserError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except (AuthenticationError, UserNotFoundError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Get current verified user."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account is not verified"
        )
    return current_user


def require_permission(required_permission: Permission):
    """Create a dependency that requires a specific permission."""

    async def permission_dependency(
        current_user: User = Depends(get_current_active_user),
        auth_service: AuthService = Depends(get_auth_service),
    ) -> User:
        """Check if current user has required permission."""
        if not auth_service.check_permission(
            UserRole(current_user.role), required_permission
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {required_permission.value}",
            )
        return current_user

    return permission_dependency


def require_role(required_role: UserRole):
    """Create a dependency that requires a specific role."""

    async def role_dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        """Check if current user has required role."""
        if UserRole(current_user.role) != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {required_role.value}",
            )
        return current_user

    return role_dependency


def require_admin():
    """Dependency that requires admin role."""
    return require_role(UserRole.ADMIN)


def require_moderator_or_admin():
    """Dependency that requires moderator or admin role."""

    async def moderator_or_admin_dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        """Check if current user is moderator or admin."""
        user_role = UserRole(current_user.role)
        if user_role not in [UserRole.MODERATOR, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Moderator or admin role required",
            )
        return current_user

    return moderator_or_admin_dependency


# Common permission dependencies
require_user_read = require_permission(Permission.USER_READ)
require_user_write = require_permission(Permission.USER_WRITE)
require_user_delete = require_permission(Permission.USER_DELETE)

require_integration_read = require_permission(Permission.INTEGRATION_READ)
require_integration_write = require_permission(Permission.INTEGRATION_WRITE)
require_integration_delete = require_permission(Permission.INTEGRATION_DELETE)
require_integration_sync = require_permission(Permission.INTEGRATION_SYNC)

require_admin_read = require_permission(Permission.ADMIN_READ)
require_admin_write = require_permission(Permission.ADMIN_WRITE)
require_admin_delete = require_permission(Permission.ADMIN_DELETE)
