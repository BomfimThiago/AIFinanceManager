"""
Shared dependencies used across the application.

This module contains common dependency functions that are used
by multiple modules for authentication, database, etc.
"""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_database_session
from src.shared.exceptions import AuthorizationError

# Security scheme
security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async for session in get_database_session():
        try:
            yield session
        finally:
            await session.close()


async def get_optional_auth_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    """Get optional authentication token from request headers."""
    if credentials:
        return credentials.credentials
    return None


async def get_required_auth_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    """Get required authentication token from request headers."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


async def get_request_id(request: Request) -> str:
    """Get or generate request ID for tracing."""
    return getattr(request.state, "request_id", "unknown")


async def get_user_agent(request: Request) -> str | None:
    """Get user agent from request headers."""
    return request.headers.get("user-agent")


async def get_client_ip(request: Request) -> str | None:
    """Get client IP address from request."""
    # Check for forwarded headers first
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip

    # Fallback to client host
    if request.client:
        return request.client.host

    return None


def require_permissions(*required_permissions: str):
    """Create dependency that requires specific permissions."""

    def permission_checker(
        user: dict = Depends("get_current_user"),
    ):  # This will be replaced with actual user dependency
        user_permissions = user.get("permissions", [])

        for permission in required_permissions:
            if permission not in user_permissions:
                raise AuthorizationError(f"Missing required permission: {permission}")

        return user

    return permission_checker


def require_roles(*required_roles: str):
    """Create dependency that requires specific roles."""

    def role_checker(
        user: dict = Depends("get_current_user"),
    ):  # This will be replaced with actual user dependency
        user_roles = user.get("roles", [])

        if not any(role in user_roles for role in required_roles):
            raise AuthorizationError(
                f"Missing required role. Need one of: {', '.join(required_roles)}"
            )

        return user

    return role_checker


class PaginationDep:
    """Pagination dependency class."""

    def __init__(self, default_size: int = 20, max_size: int = 100):
        self.default_size = default_size
        self.max_size = max_size

    def __call__(self, page: int = 1, size: int | None = None) -> dict:
        """Create pagination parameters."""
        if page < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Page must be >= 1"
            )

        if size is None:
            size = self.default_size

        if size < 1 or size > self.max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Size must be between 1 and {self.max_size}",
            )

        return {"page": page, "size": size, "offset": (page - 1) * size}


# Common pagination dependency
pagination = PaginationDep()


class RateLimitDep:
    """Rate limiting dependency class."""

    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        # In a real implementation, you'd use Redis or similar for rate limiting

    def __call__(self, request: Request, client_ip: str = Depends(get_client_ip)):
        """Check rate limits for the request."""
        # Placeholder - implement actual rate limiting logic
        # This would typically check Redis counters
        pass


# Common rate limit dependency
rate_limit = RateLimitDep()


def validate_content_type(allowed_types: list[str]):
    """Create dependency that validates request content type."""

    def content_type_validator(request: Request):
        content_type = request.headers.get("content-type", "").split(";")[0]

        if content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Content type must be one of: {', '.join(allowed_types)}",
            )

        return content_type

    return content_type_validator


# Common content type validators
json_content_type = validate_content_type(["application/json"])
multipart_content_type = validate_content_type(["multipart/form-data"])
