"""
Integration database models.

This module contains SQLAlchemy models for integration-related
database operations and table definitions.
"""

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SQLEnum

from src.database import Base
from src.shared.constants import Currency, IntegrationProvider, IntegrationStatus


class Integration(Base):
    """Integration database model."""

    __tablename__ = "integrations"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to user
    user_id = Column(Integer, nullable=False, index=True)

    # Provider information
    provider = Column(SQLEnum(IntegrationProvider), nullable=False, index=True)
    provider_item_id = Column(String(255), nullable=True)  # Provider's internal ID
    provider_access_token = Column(Text, nullable=True)  # Encrypted access token
    provider_refresh_token = Column(Text, nullable=True)  # Encrypted refresh token

    # Institution information
    institution_id = Column(String(255), nullable=False, index=True)
    institution_name = Column(String(100), nullable=False)
    institution_logo_url = Column(String(500), nullable=True)
    institution_website = Column(String(255), nullable=True)
    institution_country = Column(String(2), nullable=True)  # ISO country code

    # Connection details
    connection_name = Column(String(100), nullable=True)  # User-defined name
    status = Column(
        SQLEnum(IntegrationStatus),
        nullable=False,
        default=IntegrationStatus.PENDING,
        index=True,
    )
    error_message = Column(Text, nullable=True)
    error_code = Column(String(50), nullable=True)

    # Sync configuration
    sync_frequency = Column(String(20), nullable=False, default="daily")
    auto_sync_enabled = Column(Boolean, nullable=False, default=True)
    sync_data_types = Column(JSON, nullable=True)  # List of data types to sync

    # Last sync information
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_successful_sync_at = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(
        String(20), nullable=True
    )  # success, failed, partial, in_progress
    sync_error_message = Column(Text, nullable=True)

    # Account statistics
    accounts_count = Column(Integer, nullable=False, default=0)
    transactions_count = Column(Integer, nullable=False, default=0)
    last_transaction_date = Column(Date, nullable=True)

    # Consent and permissions
    consent_expiry_date = Column(DateTime(timezone=True), nullable=True)
    permissions = Column(JSON, nullable=True)  # List of granted permissions

    # Webhook configuration
    webhook_url = Column(String(500), nullable=True)
    webhook_secret = Column(String(255), nullable=True)  # Encrypted
    webhook_enabled = Column(Boolean, nullable=False, default=False)

    # Currency and region
    primary_currency = Column(SQLEnum(Currency), nullable=False, default=Currency.USD)
    timezone = Column(String(50), nullable=True)

    # Provider-specific metadata
    provider_data = Column(JSON, nullable=True)  # Additional provider-specific data

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    connected_at = Column(DateTime(timezone=True), nullable=True)
    disconnected_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return (
            f"<Integration(id={self.id}, provider='{self.provider}', "
            f"institution='{self.institution_name}', status='{self.status}')>"
        )

    def is_connected(self) -> bool:
        """Check if integration is currently connected."""
        return self.status == IntegrationStatus.CONNECTED

    def is_expired(self) -> bool:
        """Check if consent has expired."""
        if self.consent_expiry_date is None:
            return False
        return datetime.now(UTC) > self.consent_expiry_date

    def needs_reauth(self) -> bool:
        """Check if integration needs re-authentication."""
        return (
            self.status in [IntegrationStatus.ERROR, IntegrationStatus.EXPIRED]
            or self.is_expired()
        )

    def can_sync(self) -> bool:
        """Check if integration can perform sync operations."""
        return self.is_connected() and not self.is_expired() and self.auto_sync_enabled

    def get_status_color(self) -> str:
        """Get color code for status."""
        from src.integrations.constants import STATUS_COLORS

        return STATUS_COLORS.get(self.status.value, "#6B7280")

    def get_sync_health_score(self) -> float:
        """Calculate sync health score (0-100)."""
        if not self.last_sync_at:
            return 0.0

        score = 100.0

        # Deduct for sync errors
        if self.sync_status == "failed":
            score -= 30
        elif self.sync_status == "partial":
            score -= 15

        # Deduct for connection issues
        if self.status != IntegrationStatus.CONNECTED:
            score -= 50

        # Deduct for stale data
        if self.last_successful_sync_at:
            days_since_sync = (datetime.now(UTC) - self.last_successful_sync_at).days
            if days_since_sync > 7:
                score -= min(30, days_since_sync * 2)

        return max(0.0, score)


class ConnectedAccount(Base):
    """Connected account database model."""

    __tablename__ = "connected_accounts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    integration_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)

    # Provider account information
    provider_account_id = Column(String(255), nullable=False, index=True)
    account_type = Column(String(50), nullable=False, index=True)
    account_subtype = Column(String(50), nullable=True)

    # Account details
    account_name = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=True)  # Masked/partial
    account_mask = Column(String(20), nullable=True)  # Last 4 digits
    routing_number = Column(String(20), nullable=True)  # For bank accounts

    # Balance information
    current_balance = Column(Float, nullable=True)
    available_balance = Column(Float, nullable=True)
    currency = Column(SQLEnum(Currency), nullable=False, default=Currency.USD)
    balance_updated_at = Column(DateTime(timezone=True), nullable=True)

    # Account metadata
    is_active = Column(Boolean, nullable=False, default=True)
    is_closed = Column(Boolean, nullable=False, default=False)
    verification_status = Column(String(20), nullable=True)  # verified, pending, failed

    # Sync settings
    sync_transactions = Column(Boolean, nullable=False, default=True)
    sync_balances = Column(Boolean, nullable=False, default=True)
    last_transaction_sync = Column(DateTime(timezone=True), nullable=True)

    # Statistics
    transactions_count = Column(Integer, nullable=False, default=0)
    oldest_transaction_date = Column(Date, nullable=True)
    newest_transaction_date = Column(Date, nullable=True)

    # Provider-specific data
    provider_metadata = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<ConnectedAccount(id={self.id}, name='{self.account_name}', "
            f"type='{self.account_type}', balance={self.current_balance})>"
        )

    def get_formatted_balance(self) -> str:
        """Get formatted balance with currency symbol."""
        if self.current_balance is None:
            return "N/A"

        from src.shared.constants import CURRENCY_SYMBOLS

        symbol = CURRENCY_SYMBOLS.get(self.currency, self.currency.value)
        return f"{symbol}{self.current_balance:.2f}"

    def get_masked_account_number(self) -> str:
        """Get masked account number for display."""
        if self.account_mask:
            return f"****{self.account_mask}"
        elif self.account_number and len(self.account_number) > 4:
            return f"****{self.account_number[-4:]}"
        else:
            return "****"

    def is_balance_stale(self, hours: int = 24) -> bool:
        """Check if balance data is stale."""
        if not self.balance_updated_at:
            return True

        from datetime import timedelta

        return datetime.now(UTC) - self.balance_updated_at > timedelta(hours=hours)


class SyncLog(Base):
    """Sync operation log database model."""

    __tablename__ = "sync_logs"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    integration_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    account_id = Column(
        Integer, nullable=True, index=True
    )  # Optional account-specific sync

    # Sync operation details
    sync_type = Column(
        String(50), nullable=False, index=True
    )  # full, incremental, accounts, transactions
    data_type = Column(
        String(50), nullable=False, index=True
    )  # accounts, transactions, balances
    status = Column(
        String(20), nullable=False, index=True
    )  # started, success, failed, partial

    # Operation metadata
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Results
    records_processed = Column(Integer, nullable=False, default=0)
    records_created = Column(Integer, nullable=False, default=0)
    records_updated = Column(Integer, nullable=False, default=0)
    records_failed = Column(Integer, nullable=False, default=0)

    # Error information
    error_message = Column(Text, nullable=True)
    error_code = Column(String(50), nullable=True)
    provider_error = Column(JSON, nullable=True)  # Provider-specific error details

    # Request details
    request_id = Column(String(100), nullable=True)  # Provider request ID
    cursor = Column(String(255), nullable=True)  # Pagination cursor
    date_range_start = Column(Date, nullable=True)
    date_range_end = Column(Date, nullable=True)

    # Performance metrics
    api_calls_made = Column(Integer, nullable=False, default=0)
    data_size_kb = Column(Float, nullable=True)
    rate_limited = Column(Boolean, nullable=False, default=False)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<SyncLog(id={self.id}, type='{self.sync_type}', "
            f"status='{self.status}', records={self.records_processed})>"
        )

    def get_success_rate(self) -> float:
        """Calculate success rate for the sync operation."""
        if self.records_processed == 0:
            return 0.0

        successful = self.records_created + self.records_updated
        return (successful / self.records_processed) * 100

    def is_successful(self) -> bool:
        """Check if sync was successful."""
        return self.status == "success"

    def get_duration_seconds(self) -> float:
        """Get duration in seconds."""
        if self.duration_ms is None:
            return 0.0
        return self.duration_ms / 1000.0
