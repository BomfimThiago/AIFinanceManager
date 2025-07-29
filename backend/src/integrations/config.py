"""
Integration module configuration.

This module contains configuration settings specific to the
integrations functionality.
"""

from pydantic import Field

from src.config import ModuleSettings


class IntegrationConfig(ModuleSettings):
    """Integration module configuration."""

    # Belvo Configuration
    BELVO_SECRET_ID: str | None = Field(None, description="Belvo API secret ID")
    BELVO_SECRET_PASSWORD: str | None = Field(
        None, description="Belvo API secret password"
    )
    BELVO_ENVIRONMENT: str = Field(default="sandbox", description="Belvo environment")
    BELVO_BASE_URL: str | None = Field(None, description="Belvo base URL override")
    BELVO_WIDGET_URL: str = Field(
        default="https://widget.belvo.io", description="Belvo widget URL"
    )
    BELVO_CONSENT_PORTAL_URL: str = Field(
        default="https://meuportal.belvo.com", description="Belvo consent portal URL"
    )

    # Plaid Configuration
    PLAID_CLIENT_ID: str | None = Field(None, description="Plaid client ID")
    PLAID_SECRET: str | None = Field(None, description="Plaid secret key")
    PLAID_ENVIRONMENT: str = Field(default="sandbox", description="Plaid environment")
    PLAID_BASE_URL: str | None = Field(None, description="Plaid base URL override")

    # Sync Configuration
    DEFAULT_SYNC_FREQUENCY: str = Field(
        default="daily", description="Default sync frequency"
    )
    MAX_SYNC_RETRIES: int = Field(default=3, description="Maximum sync retries")
    SYNC_TIMEOUT_SECONDS: int = Field(
        default=300, description="Sync timeout in seconds"
    )
    BATCH_SYNC_SIZE: int = Field(
        default=100, description="Batch size for bulk sync operations"
    )

    # Rate Limiting
    PROVIDER_RATE_LIMIT_PER_MINUTE: int = Field(
        default=60, description="Provider rate limit per minute"
    )
    PROVIDER_RATE_LIMIT_PER_HOUR: int = Field(
        default=1000, description="Provider rate limit per hour"
    )

    # Webhook Configuration
    WEBHOOK_SECRET_KEY: str | None = Field(None, description="Webhook signature secret")
    WEBHOOK_TIMEOUT_SECONDS: int = Field(
        default=30, description="Webhook processing timeout"
    )

    # Data Retention
    SYNC_LOG_RETENTION_DAYS: int = Field(
        default=90, description="Sync log retention in days"
    )
    ERROR_LOG_RETENTION_DAYS: int = Field(
        default=180, description="Error log retention in days"
    )

    # Security
    ENCRYPT_TOKENS: bool = Field(default=True, description="Encrypt provider tokens")
    TOKEN_ENCRYPTION_KEY: str | None = Field(None, description="Token encryption key")

    # Feature Flags
    ENABLE_BACKGROUND_SYNC: bool = Field(
        default=True, description="Enable background sync"
    )
    ENABLE_WEBHOOK_PROCESSING: bool = Field(
        default=True, description="Enable webhook processing"
    )
    ENABLE_RETRY_FAILED_SYNCS: bool = Field(
        default=True, description="Enable retry of failed syncs"
    )

    @property
    def belvo_base_url(self) -> str:
        """Get Belvo base URL based on environment."""
        if self.BELVO_BASE_URL:
            return self.BELVO_BASE_URL

        if self.BELVO_ENVIRONMENT == "production":
            return "https://api.belvo.com"
        else:
            return "https://sandbox.belvo.com"

    @property
    def plaid_base_url(self) -> str:
        """Get Plaid base URL based on environment."""
        if self.PLAID_BASE_URL:
            return self.PLAID_BASE_URL

        env_urls = {
            "sandbox": "https://sandbox.plaid.com",
            "development": "https://development.plaid.com",
            "production": "https://production.plaid.com",
        }
        return env_urls.get(self.PLAID_ENVIRONMENT, "https://sandbox.plaid.com")

    @property
    def is_production(self) -> bool:
        """Check if any provider is in production mode."""
        return (
            self.BELVO_ENVIRONMENT == "production"
            or self.PLAID_ENVIRONMENT == "production"
        )

    def get_provider_config(self, provider: str) -> dict[str, any]:
        """Get configuration for specific provider."""
        if provider == "belvo":
            return {
                "secret_id": self.BELVO_SECRET_ID,
                "secret_password": self.BELVO_SECRET_PASSWORD,
                "environment": self.BELVO_ENVIRONMENT,
                "base_url": self.belvo_base_url,
                "widget_url": self.BELVO_WIDGET_URL,
                "consent_portal_url": self.BELVO_CONSENT_PORTAL_URL,
            }
        elif provider == "plaid":
            return {
                "client_id": self.PLAID_CLIENT_ID,
                "secret": self.PLAID_SECRET,
                "environment": self.PLAID_ENVIRONMENT,
                "base_url": self.plaid_base_url,
            }
        else:
            return {}


# Global integration config instance
integration_config = IntegrationConfig()
