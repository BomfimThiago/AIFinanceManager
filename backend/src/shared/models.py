"""
Shared Pydantic models used across the application.

This module contains base models and common response schemas
that are used by multiple modules.
"""

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict, Field


def datetime_to_gmt_str(dt: datetime) -> str:
    """Convert datetime to GMT string format."""
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.strftime("%Y-%m-%dT%H:%M:%S%z")


class CustomModel(BaseModel):
    """Custom base model with common configurations."""

    model_config = ConfigDict(
        json_encoders={datetime: datetime_to_gmt_str},
        populate_by_name=True,
        str_strip_whitespace=True,
        validate_assignment=True,
        use_enum_values=True,
    )

    def serializable_dict(self, **kwargs) -> dict[str, Any]:
        """Return a dict which contains only serializable fields."""
        default_dict = self.model_dump(**kwargs)
        return jsonable_encoder(default_dict)


class TimestampMixin(BaseModel):
    """Timestamp mixin for models with created_at and updated_at fields."""

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginationParams(CustomModel):
    """Pagination parameters for list endpoints."""

    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Items per page")

    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.size


class PaginatedResponse(CustomModel):
    """Generic paginated response."""

    items: list[Any]
    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    size: int = Field(description="Items per page")
    pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there are more pages")
    has_prev: bool = Field(description="Whether there are previous pages")

    @classmethod
    def create(
        cls, items: list[Any], total: int, page: int, size: int
    ) -> "PaginatedResponse":
        """Create paginated response from query results."""
        pages = (total + size - 1) // size  # Ceiling division
        return cls(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1,
        )


class SuccessResponse(CustomModel):
    """Generic success response."""

    success: bool = True
    message: str
    data: dict[str, Any] | None = None


class ErrorResponse(CustomModel):
    """Generic error response."""

    success: bool = False
    error: str
    details: dict[str, Any] | None = None
    error_code: str | None = None


class HealthResponse(CustomModel):
    """Health check response."""

    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str | None = None
    environment: str | None = None
    components: dict[str, str] = Field(default_factory=dict)


class FilterParams(CustomModel):
    """Base filter parameters."""

    search: str | None = Field(None, description="Search term")
    created_after: datetime | None = Field(None, description="Filter by creation date")
    created_before: datetime | None = Field(None, description="Filter by creation date")
    updated_after: datetime | None = Field(None, description="Filter by update date")
    updated_before: datetime | None = Field(None, description="Filter by update date")


class SortParams(CustomModel):
    """Sorting parameters."""

    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_order: str = Field(
        default="desc", pattern="^(asc|desc)$", description="Sort order"
    )


class BulkOperationRequest(CustomModel):
    """Base bulk operation request."""

    ids: list[int] = Field(
        min_length=1, max_length=100, description="List of IDs to process"
    )


class BulkOperationResponse(CustomModel):
    """Base bulk operation response."""

    success: bool
    processed: int = Field(description="Number of items processed")
    succeeded: int = Field(description="Number of items that succeeded")
    failed: int = Field(description="Number of items that failed")
    errors: list[str] = Field(default_factory=list, description="Error messages")


class CurrencyAmount(CustomModel):
    """Currency amount with conversion support."""

    amount: float = Field(description="Amount in the specified currency")
    currency: str = Field(
        pattern="^[A-Z]{3}$", description="Three-letter currency code"
    )
    original_amount: float | None = Field(
        None, description="Original amount before conversion"
    )
    original_currency: str | None = Field(None, description="Original currency")
    exchange_rate: float | None = Field(
        None, description="Exchange rate used for conversion"
    )
    exchange_date: datetime | None = Field(
        None, description="Date when exchange rate was captured"
    )


class FileInfo(CustomModel):
    """File information for uploads."""

    filename: str = Field(description="Original filename")
    size: int = Field(ge=0, description="File size in bytes")
    content_type: str = Field(description="MIME type")
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    processing_status: str = Field(default="pending", description="Processing status")


class LocationInfo(CustomModel):
    """Location information."""

    country: str | None = Field(None, max_length=2, description="ISO country code")
    state: str | None = Field(None, max_length=100, description="State or province")
    city: str | None = Field(None, max_length=100, description="City")
    timezone: str | None = Field(None, max_length=50, description="Timezone identifier")


class ContactInfo(CustomModel):
    """Contact information."""

    email: str | None = Field(None, description="Email address")
    phone: str | None = Field(None, description="Phone number")
    website: str | None = Field(None, description="Website URL")


# HTTP Response Models for API Documentation


class ValidationErrorDetail(CustomModel):
    """Validation error detail."""

    field: str = Field(description="Field name that failed validation")
    message: str = Field(description="Error message")
    type: str = Field(description="Error type")
    input: Any | None = Field(None, description="Input value that caused the error")


class ValidationErrorResponse(CustomModel):
    """Validation error response."""

    success: bool = False
    error: str = "Validation failed"
    details: list[ValidationErrorDetail] = Field(
        description="List of validation errors"
    )
    error_code: str = "VALIDATION_ERROR"


class NotFoundResponse(CustomModel):
    """Not found error response."""

    success: bool = False
    error: str = "Resource not found"
    error_code: str = "NOT_FOUND"
    details: dict[str, Any] | None = None


class ForbiddenResponse(CustomModel):
    """Forbidden error response."""

    success: bool = False
    error: str = "Access forbidden"
    error_code: str = "FORBIDDEN"
    details: dict[str, Any] | None = None


class UnauthorizedResponse(CustomModel):
    """Unauthorized error response."""

    success: bool = False
    error: str = "Authentication required"
    error_code: str = "UNAUTHORIZED"
    details: dict[str, Any] | None = None


class ConflictResponse(CustomModel):
    """Conflict error response."""

    success: bool = False
    error: str = "Resource conflict"
    error_code: str = "CONFLICT"
    details: dict[str, Any] | None = None


class InternalServerErrorResponse(CustomModel):
    """Internal server error response."""

    success: bool = False
    error: str = "Internal server error"
    error_code: str = "INTERNAL_ERROR"
    details: dict[str, Any] | None = None


class MessageResponse(CustomModel):
    """Simple message response."""

    message: str = Field(description="Response message")
    success: bool = True


class DeleteResponse(CustomModel):
    """Delete operation response."""

    success: bool = True
    message: str = Field(description="Deletion confirmation message")
    deleted_id: int | None = Field(None, description="ID of deleted resource")


class SyncResponse(CustomModel):
    """Integration sync response."""

    success: bool = True
    message: str = Field(description="Sync operation result")
    sync_id: str | None = Field(None, description="Sync operation identifier")
    items_synced: int | None = Field(None, description="Number of items synchronized")
    last_sync_at: datetime | None = Field(
        None, description="Timestamp of last successful sync"
    )


class WebhookResponse(CustomModel):
    """Webhook processing response."""

    status: str = Field(description="Webhook processing status")
    webhook_id: str | None = Field(None, description="Webhook identifier")
    webhook_type: str | None = Field(None, description="Type of webhook")
    webhook_code: str | None = Field(None, description="Webhook code")
    message: str | None = Field(None, description="Processing message")


class IntegrationListResponse(CustomModel):
    """Integration list response with metadata."""

    integrations: list[dict[str, Any]] = Field(description="List of integrations")
    total: int = Field(description="Total number of integrations")


class TokenResponse(CustomModel):
    """Token generation response."""

    access_token: str = Field(description="Access token")
    expires_in: int = Field(description="Token expiration time in seconds")
    token_type: str = Field(default="bearer", description="Token type")


class WidgetTokenResponse(TokenResponse):
    """Widget token response with URL."""

    widget_url: str = Field(description="Widget URL with embedded token")


class ConsentManagementUrlResponse(CustomModel):
    """Consent management URL response."""

    consent_management_url: str = Field(description="URL to consent management portal")
    access_token: str = Field(description="Access token for the portal")
    expires_in: int = Field(description="Token expiration time in seconds")


class ConsentRenewalUrlResponse(CustomModel):
    """Consent renewal URL response."""

    consent_renewal_url: str = Field(description="URL to consent renewal portal")
    access_token: str = Field(description="Access token for the portal")
    expires_in: int = Field(description="Token expiration time in seconds")


class ConnectionSaveResponse(CustomModel):
    """Connection save response."""

    success: bool = True
    integration_id: int = Field(description="ID of created integration")
    institution_name: str = Field(description="Name of connected institution")
    message: str = Field(
        default="Connection saved successfully", description="Success message"
    )
