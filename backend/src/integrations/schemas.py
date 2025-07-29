"""
Integration Pydantic schemas.

This module contains all Pydantic models related to integrations,
including request/response models and data validation schemas.
"""

from datetime import date, datetime
from typing import Any

from pydantic import Field, field_validator

from src.integrations.constants import (
    INTEGRATION_PROVIDERS,
    SYNC_DATA_TYPES,
    SYNC_FREQUENCIES,
)
from src.shared.constants import Currency, IntegrationProvider, IntegrationStatus
from src.shared.models import CustomModel, TimestampMixin


class IntegrationBase(CustomModel):
    """Base integration model with common fields."""

    provider: IntegrationProvider = Field(description="Integration provider")
    institution_id: str = Field(
        min_length=1, max_length=255, description="Institution ID"
    )
    institution_name: str = Field(
        min_length=1, max_length=100, description="Institution name"
    )
    connection_name: str | None = Field(
        None, max_length=100, description="User-defined connection name"
    )
    sync_frequency: str = Field(default="daily", description="Sync frequency")
    auto_sync_enabled: bool = Field(
        default=True, description="Enable automatic synchronization"
    )
    primary_currency: Currency = Field(
        default=Currency.USD, description="Primary currency"
    )


class IntegrationCreate(IntegrationBase):
    """Integration creation schema."""

    user_id: int = Field(description="User ID")
    status: IntegrationStatus = Field(
        default=IntegrationStatus.PENDING, description="Integration status"
    )
    provider_item_id: str | None = Field(
        None, description="Provider's internal item ID"
    )
    provider_access_token: str | None = Field(None, description="Provider access token")
    provider_refresh_token: str | None = Field(
        None, description="Provider refresh token"
    )
    institution_logo_url: str | None = Field(None, description="Institution logo URL")
    institution_website: str | None = Field(None, description="Institution website")
    institution_country: str | None = Field(
        None, max_length=2, description="ISO country code"
    )
    sync_data_types: list[str] | None = Field(None, description="Data types to sync")
    permissions: list[str] | None = Field(None, description="Granted permissions")
    consent_expiry_date: datetime | None = Field(
        None, description="Consent expiry date"
    )
    webhook_enabled: bool = Field(default=False, description="Enable webhooks")
    timezone: str | None = Field(None, description="Timezone")
    provider_data: dict[str, Any] | None = Field(
        None, description="Provider-specific metadata"
    )

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v) -> IntegrationProvider:
        """Validate provider."""
        # Handle both string and enum inputs
        if isinstance(v, str):
            if v not in [p.value for p in INTEGRATION_PROVIDERS]:
                raise ValueError(
                    f"Invalid provider. Must be one of: {[p.value for p in INTEGRATION_PROVIDERS]}"
                )
            return IntegrationProvider(v)
        elif isinstance(v, IntegrationProvider):
            if v.value not in [p.value for p in INTEGRATION_PROVIDERS]:
                raise ValueError(
                    f"Invalid provider. Must be one of: {[p.value for p in INTEGRATION_PROVIDERS]}"
                )
            return v
        else:
            raise ValueError("Provider must be string or IntegrationProvider enum")

    @field_validator("sync_frequency")
    @classmethod
    def validate_sync_frequency(cls, v: str) -> str:
        """Validate sync frequency."""
        if v not in SYNC_FREQUENCIES:
            raise ValueError(
                f"Invalid sync frequency. Must be one of: {SYNC_FREQUENCIES}"
            )
        return v

    @field_validator("sync_data_types")
    @classmethod
    def validate_sync_data_types(cls, v: list[str] | None) -> list[str] | None:
        """Validate sync data types."""
        if v is not None:
            for data_type in v:
                if data_type not in SYNC_DATA_TYPES:
                    raise ValueError(f"Invalid sync data type: {data_type}")
        return v


class IntegrationUpdate(CustomModel):
    """Integration update schema."""

    connection_name: str | None = Field(
        None, max_length=100, description="Connection name"
    )
    sync_frequency: str | None = Field(None, description="Sync frequency")
    auto_sync_enabled: bool | None = Field(None, description="Enable auto sync")
    sync_data_types: list[str] | None = Field(None, description="Data types to sync")
    webhook_enabled: bool | None = Field(None, description="Enable webhooks")
    status: str | None = Field(None, description="Integration status")

    @field_validator("sync_frequency")
    @classmethod
    def validate_sync_frequency(cls, v: str | None) -> str | None:
        """Validate sync frequency."""
        if v is not None and v not in SYNC_FREQUENCIES:
            raise ValueError(
                f"Invalid sync frequency. Must be one of: {SYNC_FREQUENCIES}"
            )
        return v


class Integration(IntegrationBase, TimestampMixin):
    """Integration response schema."""

    id: int
    user_id: int

    provider_item_id: str | None = None
    institution_logo_url: str | None = None
    institution_website: str | None = None
    institution_country: str | None = None

    status: str
    error_message: str | None = None
    error_code: str | None = None

    sync_data_types: list[str] | None = None
    last_sync_at: datetime | None = None
    last_successful_sync_at: datetime | None = None
    sync_status: str | None = None
    sync_error_message: str | None = None

    accounts_count: int
    transactions_count: int
    last_transaction_date: date | None = None

    consent_expiry_date: datetime | None = None
    permissions: list[str] | None = None

    webhook_enabled: bool
    timezone: str | None = None
    metadata: dict[str, Any] | None = None

    connected_at: datetime | None = None
    disconnected_at: datetime | None = None

    # Computed fields
    is_connected: bool | None = None
    is_expired: bool | None = None
    needs_reauth: bool | None = None
    can_sync: bool | None = None
    status_color: str | None = None
    sync_health_score: float | None = None

    class Config:
        from_attributes = True


class ConnectedAccountBase(CustomModel):
    """Base connected account model."""

    provider_account_id: str = Field(
        min_length=1, max_length=255, description="Provider account ID"
    )
    account_type: str = Field(min_length=1, max_length=50, description="Account type")
    account_subtype: str | None = Field(
        None, max_length=50, description="Account subtype"
    )
    account_name: str = Field(min_length=1, max_length=100, description="Account name")
    currency: Currency = Field(default=Currency.USD, description="Account currency")


class ConnectedAccountCreate(ConnectedAccountBase):
    """Connected account creation schema."""

    account_number: str | None = Field(
        None, max_length=50, description="Account number"
    )
    account_mask: str | None = Field(None, max_length=20, description="Account mask")
    routing_number: str | None = Field(
        None, max_length=20, description="Routing number"
    )
    current_balance: float | None = Field(None, description="Current balance")
    available_balance: float | None = Field(None, description="Available balance")
    verification_status: str | None = Field(None, description="Verification status")
    sync_transactions: bool = Field(default=True, description="Sync transactions")
    sync_balances: bool = Field(default=True, description="Sync balances")
    provider_metadata: dict[str, Any] | None = Field(
        None, description="Provider metadata"
    )


class ConnectedAccountUpdate(CustomModel):
    """Connected account update schema."""

    account_name: str | None = Field(
        None, min_length=1, max_length=100, description="Account name"
    )
    current_balance: float | None = Field(None, description="Current balance")
    available_balance: float | None = Field(None, description="Available balance")
    is_active: bool | None = Field(None, description="Account active status")
    sync_transactions: bool | None = Field(None, description="Sync transactions")
    sync_balances: bool | None = Field(None, description="Sync balances")


class ConnectedAccount(ConnectedAccountBase, TimestampMixin):
    """Connected account response schema."""

    id: int
    integration_id: int
    user_id: int

    account_number: str | None = None
    account_mask: str | None = None
    routing_number: str | None = None

    current_balance: float | None = None
    available_balance: float | None = None
    balance_updated_at: datetime | None = None

    is_active: bool
    is_closed: bool
    verification_status: str | None = None

    sync_transactions: bool
    sync_balances: bool
    last_transaction_sync: datetime | None = None

    transactions_count: int
    oldest_transaction_date: date | None = None
    newest_transaction_date: date | None = None

    provider_metadata: dict[str, Any] | None = None

    # Computed fields
    formatted_balance: str | None = None
    masked_account_number: str | None = None
    is_balance_stale: bool | None = None

    class Config:
        from_attributes = True


class IntegrationFilter(CustomModel):
    """Integration filtering parameters."""

    provider: str | None = Field(None, description="Filter by provider")
    status: str | None = Field(None, description="Filter by status")
    institution_id: str | None = Field(None, description="Filter by institution ID")
    institution_country: str | None = Field(None, description="Filter by country")
    sync_frequency: str | None = Field(None, description="Filter by sync frequency")
    auto_sync_enabled: bool | None = Field(None, description="Filter by auto sync")
    webhook_enabled: bool | None = Field(None, description="Filter by webhook enabled")
    has_errors: bool | None = Field(None, description="Filter by error status")
    last_sync_before: datetime | None = Field(None, description="Last sync before date")
    last_sync_after: datetime | None = Field(None, description="Last sync after date")
    created_after: date | None = Field(None, description="Created after date")
    created_before: date | None = Field(None, description="Created before date")


class SyncRequest(CustomModel):
    """Data synchronization request schema."""

    sync_type: str = Field(default="incremental", description="Sync type")
    data_types: list[str] | None = Field(None, description="Data types to sync")
    account_ids: list[int] | None = Field(None, description="Specific accounts to sync")
    date_from: date | None = Field(None, description="Start date for sync")
    date_to: date | None = Field(None, description="End date for sync")
    force_sync: bool = Field(default=False, description="Force sync even if recent")

    @field_validator("sync_type")
    @classmethod
    def validate_sync_type(cls, v: str) -> str:
        """Validate sync type."""
        valid_types = ["full", "incremental", "accounts", "transactions", "balances"]
        if v not in valid_types:
            raise ValueError(f"Invalid sync type. Must be one of: {valid_types}")
        return v

    @field_validator("data_types")
    @classmethod
    def validate_data_types(cls, v: list[str] | None) -> list[str] | None:
        """Validate data types."""
        if v is not None:
            for data_type in v:
                if data_type not in SYNC_DATA_TYPES:
                    raise ValueError(f"Invalid data type: {data_type}")
        return v


class SyncResult(CustomModel):
    """Data synchronization result schema."""

    success: bool
    sync_type: str
    data_types: list[str]
    started_at: datetime
    completed_at: datetime | None = None
    duration_ms: int | None = None

    records_processed: int
    records_created: int
    records_updated: int
    records_failed: int

    accounts_synced: int
    transactions_synced: int

    error_message: str | None = None
    error_code: str | None = None
    warnings: list[str] = []

    request_id: str | None = None
    api_calls_made: int
    rate_limited: bool = False


class WebhookEvent(CustomModel):
    """Webhook event schema."""

    event_type: str = Field(description="Event type")
    event_code: str | None = Field(None, description="Event code")
    link_id: str | None = Field(None, description="Link ID")
    request_id: str | None = Field(None, description="Request ID")
    external_id: str | None = Field(None, description="External ID")
    data: dict[str, Any] = Field(default_factory=dict, description="Event data")


class BelvoConnectionData(CustomModel):
    """Belvo connection data from widget."""

    link_id: str = Field(description="Belvo link ID")
    institution: dict[str, Any] = Field(description="Institution data")


class BelvoWidgetTokenResponse(CustomModel):
    """Belvo widget token response."""

    access_token: str = Field(description="Widget access token")
    widget_url: str = Field(description="Widget URL")
    expires_in: int = Field(description="Token expiry in seconds")


class IntegrationSummary(CustomModel):
    """Integration summary statistics."""

    total_integrations: int
    connected_integrations: int
    error_integrations: int
    pending_integrations: int
    total_accounts: int
    total_transactions: int
    providers_used: list[str]
    countries_covered: list[str]
    last_sync_status: dict[str, int]
    avg_sync_health_score: float


class ProviderInfo(CustomModel):
    """Provider information schema."""

    provider: str
    name: str
    description: str
    supported_countries: list[str]
    supported_currencies: list[str]
    supports_webhooks: bool
    max_connections: int
    status: str = "available"


class InstitutionInfo(CustomModel):
    """Institution information schema."""

    institution_id: str
    name: str
    website: str | None = None
    logo_url: str | None = None
    country: str
    supported_products: list[str]
    oauth_required: bool = False
    mfa_required: bool = False


# Response models for API endpoints
class IntegrationResponse(CustomModel):
    """Integration response model for API."""

    id: int
    user_id: int
    provider: str
    provider_item_id: str | None = None
    provider_access_token: str | None = None
    provider_refresh_token: str | None = None
    institution_id: str
    institution_name: str
    institution_logo_url: str | None = None
    institution_website: str | None = None
    institution_country: str | None = None
    connection_name: str | None = None
    status: str
    error_message: str | None = None
    error_code: str | None = None
    sync_frequency: str
    auto_sync_enabled: bool
    sync_data_types: list[str] | None = None
    last_sync_at: datetime | None = None
    last_successful_sync_at: datetime | None = None
    sync_status: str | None = None
    sync_error_message: str | None = None
    accounts_count: int
    transactions_count: int
    last_transaction_date: date | None = None
    consent_expiry_date: datetime | None = None
    permissions: list[str] | None = None
    webhook_url: str | None = None
    webhook_secret: str | None = None
    webhook_enabled: bool
    primary_currency: str
    timezone: str | None = None
    provider_data: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime
    connected_at: datetime | None = None
    disconnected_at: datetime | None = None


class IntegrationsListResponse(CustomModel):
    """List of integrations response model."""

    integrations: list[IntegrationResponse]
    total: int


class ConnectionSaveResponse(CustomModel):
    """Response model for saving Belvo connection."""

    integration_id: int
    institution_name: str
    success: bool = True


class SyncTransactionsResponse(CustomModel):
    """Response model for transaction sync."""

    transactions_fetched: int
    expenses_created: int
    errors: int = 0
    success: bool = True


class DeleteIntegrationResponse(CustomModel):
    """Response model for integration deletion."""

    message: str
    success: bool = True


class HistoricalUpdateResponse(CustomModel):
    """Response model for historical update trigger."""

    status: str = "update_requested"
    request_id: str | None = None
    resources: list[str]
    message: str


class ConsentManagementRequest(CustomModel):
    """Request model for consent management portal access."""

    cpf: str = Field(description="User's CPF number")
    full_name: str = Field(description="User's full name")
    cnpj: str | None = Field(None, description="User's CNPJ (for business users)")
    terms_and_conditions_url: str | None = Field(
        None, description="URL to your terms and conditions"
    )


class ConsentManagementResponse(CustomModel):
    """Response model for consent management portal URL."""

    consent_management_url: str = Field(
        description="URL to Belvo consent management portal"
    )
    access_token: str = Field(description="Access token for the portal")
    expires_in: int = Field(
        default=3600, description="Token expiration time in seconds"
    )


class ConsentRenewalRequest(CustomModel):
    """Request model for consent renewal portal access."""

    cpf: str = Field(description="User's CPF number")
    full_name: str = Field(description="User's full name")
    link_id: str = Field(description="Belvo link ID from webhook")
    consent_id: str = Field(description="Consent ID from webhook")
    institution: str = Field(description="Institution code from webhook")
    institution_display_name: str = Field(
        description="Institution display name from webhook"
    )
    institution_icon_logo: str | None = Field(
        None, description="Institution logo URL from webhook"
    )
    cnpj: str | None = Field(None, description="User's CNPJ (for business users)")
    terms_and_conditions_url: str | None = Field(
        None, description="URL to your terms and conditions"
    )


class ConsentRenewalResponse(CustomModel):
    """Response model for consent renewal portal URL."""

    consent_renewal_url: str = Field(description="URL to Belvo consent renewal portal")
    access_token: str = Field(description="Access token for the portal")
    expires_in: int = Field(
        default=3600, description="Token expiration time in seconds"
    )


class WebhookResponse(CustomModel):
    """Response model for webhook acknowledgment."""

    status: str
    webhook_id: str | None = None
    webhook_type: str | None = None
    webhook_code: str | None = None
    reason: str | None = None
    message: str | None = None
