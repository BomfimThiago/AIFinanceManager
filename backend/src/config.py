from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/finance_manager"

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # AI Services
    anthropic_api_key: str = ""

    # AWS Bedrock (optional - for using Claude via Bedrock instead of direct API)
    use_bedrock: bool = False  # Set to True to use AWS Bedrock instead of Anthropic API
    bedrock_region: str = "us-east-1"  # Bedrock region (may differ from main AWS region)
    aws_region: str = "eu-west-3"  # Main AWS region for other services

    # Sentry
    sentry_dsn: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8003

    # CORS
    cors_origins: list[str] = ["http://localhost:8081", "http://localhost:19006"]

    # Environment
    environment: str = "development"
    debug: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
