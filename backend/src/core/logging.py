"""
Logging configuration with Sentry integration.

Usage:
    from src.core.logging import get_logger, log_error, log_info

    logger = get_logger(__name__)
    logger.info("Something happened")
    logger.error("Something went wrong", exc_info=True)

    # Or use convenience functions with automatic Sentry capture
    log_info("User logged in", user_id=123)
    log_error("Payment failed", error=e, user_id=123, amount=100)
"""

import logging
import sys
from typing import Any

import sentry_sdk

from src.config import get_settings

settings = get_settings()


def setup_logging() -> None:
    """Configure logging for the application."""
    log_level = logging.DEBUG if settings.debug else logging.INFO

    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("python_multipart").setLevel(logging.WARNING)
    logging.getLogger("pytesseract").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for the given name."""
    return logging.getLogger(name)


def log_info(message: str, **context: Any) -> None:
    """Log an info message with optional context."""
    logger = logging.getLogger("app")
    if context:
        logger.info(f"{message} | context={context}")
    else:
        logger.info(message)


def log_warning(message: str, **context: Any) -> None:
    """Log a warning message with optional context."""
    logger = logging.getLogger("app")
    if context:
        logger.warning(f"{message} | context={context}")
    else:
        logger.warning(message)


def log_error(
    message: str,
    error: Exception | None = None,
    capture_sentry: bool = True,
    **context: Any,
) -> None:
    """
    Log an error message and optionally capture to Sentry.

    Args:
        message: Error message to log
        error: Optional exception to include
        capture_sentry: Whether to send to Sentry (default True)
        **context: Additional context to include in logs and Sentry
    """
    logger = logging.getLogger("app")

    # Build log message
    log_msg = message
    if context:
        log_msg = f"{message} | context={context}"

    # Log locally
    if error:
        logger.error(log_msg, exc_info=error)
    else:
        logger.error(log_msg)

    # Capture to Sentry
    if capture_sentry and settings.sentry_dsn:
        with sentry_sdk.push_scope() as scope:
            # Add context as tags/extra
            for key, value in context.items():
                if isinstance(value, (str, int, float, bool)):
                    scope.set_tag(key, str(value))
                else:
                    scope.set_extra(key, value)

            scope.set_extra("message", message)

            if error:
                sentry_sdk.capture_exception(error)
            else:
                sentry_sdk.capture_message(message, level="error")


def capture_exception(error: Exception, **context: Any) -> None:
    """Capture an exception to Sentry with context."""
    if settings.sentry_dsn:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                if isinstance(value, (str, int, float, bool)):
                    scope.set_tag(key, str(value))
                else:
                    scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)


def set_user_context(user_id: int, email: str | None = None) -> None:
    """Set the current user context for Sentry."""
    sentry_sdk.set_user({"id": str(user_id), "email": email})


def add_breadcrumb(
    message: str,
    category: str = "app",
    level: str = "info",
    **data: Any,
) -> None:
    """Add a breadcrumb for Sentry error tracking."""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data,
    )
