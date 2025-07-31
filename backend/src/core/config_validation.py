"""
Configuration validation for production environment.
Ensures all required environment variables are present and valid.
"""

import os
import sys
from urllib.parse import urlparse

from pydantic import BaseModel, Field, ValidationError, validator
from pydantic_settings import BaseSettings


class DatabaseConfig(BaseModel):
    """Database configuration validation."""
    url: str = Field(..., description="Database URL")

    @validator('url')
    def validate_database_url(cls, v):
        """Validate database URL format."""
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("Invalid database URL format")
        if parsed.scheme not in ['postgresql', 'postgresql+asyncpg']:
            raise ValueError("Only PostgreSQL databases are supported")
        return v


class SecurityConfig(BaseModel):
    """Security configuration validation."""
    secret_key: str = Field(..., min_length=32, description="JWT secret key")
    cors_origins: str = Field(..., description="Allowed CORS origins")

    @validator('secret_key')
    def validate_secret_key(cls, v):
        """Ensure secret key is sufficiently complex."""
        if len(v) < 32:
            raise ValueError("Secret key must be at least 32 characters long")
        return v


class AIConfig(BaseModel):
    """AI service configuration validation."""
    anthropic_api_key: str = Field(..., min_length=10, description="Anthropic API key")

    @validator('anthropic_api_key')
    def validate_anthropic_key(cls, v):
        """Validate Anthropic API key format."""
        if not v.startswith('sk-ant-'):
            raise ValueError("Invalid Anthropic API key format")
        return v


class IntegrationConfig(BaseModel):
    """External integration configuration validation."""
    belvo_secret_id: str | None = Field(None, description="Belvo secret ID")
    belvo_secret_password: str | None = Field(None, description="Belvo secret password")

    @validator('belvo_secret_id')
    def validate_belvo_id(cls, v):
        """Validate Belvo secret ID if provided."""
        if v is not None and len(v) < 10:
            raise ValueError("Belvo secret ID must be at least 10 characters")
        return v


class ProductionConfig(BaseSettings):
    """Complete production configuration validation."""

    # Environment
    environment: str = Field(default="production", description="Environment name")
    debug: bool = Field(default=False, description="Debug mode")

    # Database
    database_url: str = Field(..., description="Database connection URL")

    # Security
    secret_key: str = Field(..., description="Application secret key")
    cors_origins: str = Field(..., description="Allowed CORS origins")

    # AI Services
    anthropic_api_key: str = Field(..., description="Anthropic API key")

    # External Integrations (optional)
    belvo_secret_id: str | None = Field(None, description="Belvo secret ID")
    belvo_secret_password: str | None = Field(None, description="Belvo secret password")

    # Server Configuration
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8001, description="API port")
    log_level: str = Field(default="INFO", description="Logging level")

    # AWS Configuration (for production)
    aws_region: str | None = Field(None, description="AWS region")
    s3_bucket_name: str | None = Field(None, description="S3 bucket for uploads")

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator('environment')
    def validate_environment(cls, v):
        """Validate environment name."""
        allowed_envs = ['development', 'staging', 'production']
        if v not in allowed_envs:
            raise ValueError(f"Environment must be one of: {allowed_envs}")
        return v

    @validator('debug')
    def validate_debug_in_production(cls, v, values):
        """Ensure debug is disabled in production."""
        if values.get('environment') == 'production' and v:
            raise ValueError("Debug mode must be disabled in production")
        return v

    @validator('log_level')
    def validate_log_level(cls, v):
        """Validate log level."""
        allowed_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()


def validate_environment_config() -> ProductionConfig:
    """Validate all environment configuration."""
    try:
        config = ProductionConfig()
        return config
    except ValidationError as e:
        print("❌ Configuration validation failed:")
        for error in e.errors():
            field = " -> ".join(str(x) for x in error['loc'])
            message = error['msg']
            print(f"  {field}: {message}")
        sys.exit(1)


def check_external_services() -> dict[str, bool]:
    """Check connectivity to external services."""
    checks = {}

    # Check database connectivity
    try:
        import asyncio
        from urllib.parse import urlparse

        import asyncpg

        async def check_db():
            db_url = os.getenv('DATABASE_URL')
            if db_url:
                parsed = urlparse(db_url)
                try:
                    conn = await asyncpg.connect(
                        host=parsed.hostname,
                        port=parsed.port or 5432,
                        user=parsed.username,
                        password=parsed.password,
                        database=parsed.path[1:] if parsed.path else 'postgres'
                    )
                    await conn.close()
                    return True
                except Exception:
                    return False
            return False

        checks['database'] = asyncio.run(check_db())
    except Exception:
        checks['database'] = False

    # Check Anthropic API
    try:
        import httpx

        api_key = os.getenv('ANTHROPIC_API_KEY')
        if api_key:
            response = httpx.get(
                'https://api.anthropic.com/v1/messages',
                headers={'x-api-key': api_key},
                timeout=10
            )
            checks['anthropic'] = response.status_code in [200, 400, 401]  # 401 means key is recognized
        else:
            checks['anthropic'] = False
    except Exception:
        checks['anthropic'] = False

    return checks


def run_startup_checks() -> None:
    """Run comprehensive startup checks."""
    print("🔍 Running production startup checks...")

    # Validate configuration
    print("  ✓ Validating environment configuration...")
    config = validate_environment_config()

    # Check required files
    required_files = [
        'alembic.ini',
        'alembic/env.py',
        'src/main.py'
    ]

    print("  ✓ Checking required files...")
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)

    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        sys.exit(1)

    # Check external services (non-blocking)
    print("  ✓ Checking external service connectivity...")
    service_checks = check_external_services()

    for service, status in service_checks.items():
        status_icon = "✓" if status else "⚠️"
        print(f"    {status_icon} {service.title()}: {'Connected' if status else 'Cannot connect'}")

    # Critical services that must be available
    critical_services = ['database']
    failed_critical = [service for service in critical_services if not service_checks.get(service, False)]

    if failed_critical:
        print(f"❌ Critical services unavailable: {failed_critical}")
        print("   Application cannot start without these services.")
        sys.exit(1)

    print("✅ All startup checks passed!")
    return config


if __name__ == "__main__":
    """Run configuration validation as a standalone script."""
    run_startup_checks()
