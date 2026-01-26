from fastapi import Request
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from src.shared.exceptions import RateLimitExceededError


def get_client_ip(request: Request) -> str:
    """Get client IP for rate limiting"""
    # Check for X-Forwarded-For header (for load balancers/proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    # Check for X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Fall back to remote address
    return get_remote_address(request)


def get_authenticated_user_id(request: Request) -> str:
    """Get authenticated user ID for rate limiting"""
    # This will be populated by the auth dependency
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"

    # Fall back to IP-based rate limiting for unauthenticated requests
    return f"ip:{get_client_ip(request)}"


# Create limiter instance
limiter = Limiter(
    key_func=get_authenticated_user_id,
    default_limits=["100/minute"]
)


# Custom rate limit exceeded handler
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    raise RateLimitExceededError(
        detail=f"Rate limit exceeded: {exc.detail}"
    )


# Rate limiting decorators for common use cases
def rate_limit_upload():
    """Rate limit for file uploads - very restrictive"""
    return limiter.limit("10/minute")


def rate_limit_auth():
    """Rate limit for authentication endpoints"""
    return limiter.limit("5/minute")


def rate_limit_api():
    """Standard rate limit for API endpoints"""
    return limiter.limit("30/minute")


def rate_limit_read():
    """Rate limit for read-only endpoints - more permissive"""
    return limiter.limit("60/minute")
