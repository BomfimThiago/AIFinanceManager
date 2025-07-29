"""
Global application configuration.

This module contains the main application settings that are shared
across all modules. Module-specific configs should be in their
respective config.py files.
"""

from functools import lru_cache

from pydantic import Field, PostgresDsn, validator
from pydantic_settings import BaseSettings

from src.shared.constants import Environment


class Settings(BaseSettings):
    """Global application settings."""

    # Application
    APP_NAME: str = "AI Finance Manager"
    APP_VERSION: str = "1.0.0"
    API_VERSION: str = "v1"
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = False

    # API Configuration
    API_HOST: str = "localhost"
    API_PORT: int = 8001
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: PostgresDsn = Field(description="PostgreSQL database URL")
    DATABASE_ECHO: bool = False
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Security
    SECRET_KEY: str = Field(
        min_length=32, description="Secret key for JWT token generation"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        description="Allowed CORS origins (comma-separated)",
    )
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # External Services
    ANTHROPIC_API_KEY: str | None = None
    BELVO_SECRET_ID: str | None = None
    BELVO_SECRET_PASSWORD: str | None = None
    BELVO_ENVIRONMENT: str = "sandbox"  # sandbox or production
    BELVO_ENV: str | None = None  # Legacy field name
    BELVO_WEBHOOK_SECRET: str | None = None
    PLAID_CLIENT_ID: str | None = None
    PLAID_SECRET: str | None = None
    PLAID_ENVIRONMENT: str = "sandbox"  # sandbox, development, or production

    # Currency Service
    FRANKFURTER_API_URL: str = "https://api.frankfurter.app"

    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ]
    UPLOAD_DIR: str = "uploads"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_REQUESTS_PER_HOUR: int = 1000

    # Documentation (shown only in allowed environments)
    DOCS_URL: str | None = "/docs"
    REDOC_URL: str | None = "/redoc"
    OPENAPI_URL: str | None = "/openapi.json"
    SHOW_DOCS_ENVIRONMENTS: str = "local,development,staging"

    # Monitoring
    SENTRY_DSN: str | None = None
    ENABLE_METRICS: bool = False
    METRICS_PORT: int = 8002

    @validator("DOCS_URL", "REDOC_URL", "OPENAPI_URL", pre=True)
    def hide_docs_unless_allowed(cls, v, values):
        """Hide documentation unless in explicitly allowed environments."""
        # Get environment - it could be an enum or string
        environment = values.get("ENVIRONMENT", "")
        if hasattr(environment, "value"):
            environment_str = environment.value.lower()
        else:
            environment_str = str(environment).lower()

        show_docs_envs_str = values.get(
            "SHOW_DOCS_ENVIRONMENTS", "local,development,staging"
        )
        show_docs_envs = [env.strip().lower() for env in show_docs_envs_str.split(",")]

        if environment_str not in show_docs_envs:
            return None
        return v

    @validator("DEBUG", pre=True)
    def set_debug_mode(cls, v, values):
        """Set debug mode based on environment."""
        environment = values.get("ENVIRONMENT")
        return environment in [Environment.LOCAL, Environment.DEVELOPMENT]

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def show_docs_environments_list(self) -> list[str]:
        """Parse allowed documentation environments from comma-separated string."""
        return [env.strip().lower() for env in self.SHOW_DOCS_ENVIRONMENTS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


# Global settings instance
settings = get_settings()


# Module-specific settings can import this and extend
class ModuleSettings(BaseSettings):
    """Base class for module-specific settings."""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
