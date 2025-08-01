"""
Shared Pydantic schemas used across the application.

This module contains base schemas and common request/response models
that are used by multiple modules.
"""

from datetime import datetime
from typing import Any

from pydantic import Field

from src.shared.constants import Currency
from src.shared.models import CustomModel


class IdResponse(CustomModel):
    """Simple ID response."""

    id: int


class MessageResponse(CustomModel):
    """Simple message response."""

    message: str


class SuccessResponse(CustomModel):
    """Generic success response."""

    success: bool = True
    message: str
    data: dict[str, Any] | None = None


class ErrorDetail(CustomModel):
    """Error detail schema."""

    field: str | None = None
    message: str
    code: str | None = None


class ErrorResponse(CustomModel):
    """Generic error response."""

    success: bool = False
    error: str
    details: list[ErrorDetail] | None = None
    error_code: str | None = None


class PaginationMeta(CustomModel):
    """Pagination metadata."""

    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    size: int = Field(description="Items per page")
    pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether there are more pages")
    has_prev: bool = Field(description="Whether there are previous pages")


class PaginatedResponse(CustomModel):
    """Generic paginated response."""

    items: list[Any]
    meta: PaginationMeta

    @classmethod
    def create(
        cls, items: list[Any], total: int, page: int, size: int
    ) -> "PaginatedResponse":
        """Create paginated response from query results."""
        pages = (total + size - 1) // size  # Ceiling division
        meta = PaginationMeta(
            total=total,
            page=page,
            size=size,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1,
        )
        return cls(items=items, meta=meta)


class HealthCheckResponse(CustomModel):
    """Health check response."""

    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str | None = None
    environment: str | None = None
    components: dict[str, str] = Field(default_factory=dict)


class CurrencyAmountSchema(CustomModel):
    """Currency amount schema."""

    amount: float = Field(description="Amount in the specified currency")
    currency: Currency = Field(description="Currency code")
    original_amount: float | None = Field(
        None, description="Original amount before conversion"
    )
    original_currency: Currency | None = Field(None, description="Original currency")
    exchange_rate: float | None = Field(None, description="Exchange rate used")
    exchange_date: datetime | None = Field(None, description="Exchange rate date")


class FileUploadResponse(CustomModel):
    """File upload response."""

    filename: str
    size: int
    content_type: str
    upload_id: str
    processing_status: str = "pending"


class BulkOperationRequest(CustomModel):
    """Base bulk operation request."""

    ids: list[int] = Field(min_length=1, max_length=100, description="List of IDs")


class BulkOperationResponse(CustomModel):
    """Base bulk operation response."""

    success: bool
    processed: int = Field(description="Number of items processed")
    succeeded: int = Field(description="Number of items that succeeded")
    failed: int = Field(description="Number of items that failed")
    errors: list[str] = Field(default_factory=list, description="Error messages")


class DateRangeFilter(CustomModel):
    """Date range filter."""

    start_date: datetime | None = Field(None, description="Start date")
    end_date: datetime | None = Field(None, description="End date")


class SearchFilter(CustomModel):
    """Search filter."""

    query: str | None = Field(
        None, min_length=1, max_length=255, description="Search query"
    )
    fields: list[str] | None = Field(None, description="Fields to search in")


class SortOptions(CustomModel):
    """Sort options."""

    field: str = Field(description="Field to sort by")
    direction: str = Field(
        default="desc", pattern="^(asc|desc)$", description="Sort direction"
    )


class FilterOptions(CustomModel):
    """Base filter options."""

    search: SearchFilter | None = None
    date_range: DateRangeFilter | None = None
    sort: SortOptions | None = None


class UserInfo(CustomModel):
    """Basic user information."""

    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    is_active: bool = True


class AuditLog(CustomModel):
    """Audit log entry."""

    action: str = Field(description="Action performed")
    resource: str = Field(description="Resource affected")
    resource_id: str | None = Field(None, description="Resource ID")
    user_id: int | None = Field(None, description="User who performed action")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: dict[str, Any] | None = Field(None, description="Additional details")


class WebhookPayload(CustomModel):
    """Webhook payload schema."""

    event: str = Field(description="Event type")
    data: dict[str, Any] = Field(description="Event data")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    signature: str | None = Field(None, description="Webhook signature")


class ApiKeyInfo(CustomModel):
    """API key information."""

    key_id: str
    name: str
    permissions: list[str]
    created_at: datetime
    last_used: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool = True


class RateLimitInfo(CustomModel):
    """Rate limit information."""

    limit: int = Field(description="Request limit")
    remaining: int = Field(description="Remaining requests")
    reset_time: datetime = Field(description="When limit resets")
    window_seconds: int = Field(description="Rate limit window in seconds")


class SystemMetrics(CustomModel):
    """System metrics."""

    cpu_usage: float = Field(ge=0, le=100, description="CPU usage percentage")
    memory_usage: float = Field(ge=0, le=100, description="Memory usage percentage")
    disk_usage: float = Field(ge=0, le=100, description="Disk usage percentage")
    active_connections: int = Field(ge=0, description="Active database connections")
    request_count: int = Field(ge=0, description="Request count in last period")
    error_count: int = Field(ge=0, description="Error count in last period")


class ConfigurationItem(CustomModel):
    """Configuration item."""

    key: str
    value: Any
    description: str | None = None
    is_secret: bool = False
    category: str | None = None


class ValidationResult(CustomModel):
    """Validation result."""

    is_valid: bool
    errors: list[ErrorDetail] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
