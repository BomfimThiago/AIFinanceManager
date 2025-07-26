import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Database settings
    DATABASE_URL: str = (
        "postgresql+asyncpg://ai_finance_user:ai_finance_password@localhost:5433/ai_finance_db"
    )
    DATABASE_ECHO: bool = True  # Set to False in production

    # JWT settings
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Bank Integration APIs
    PLAID_CLIENT_ID: str = ""
    PLAID_SECRET: str = ""
    PLAID_ENV: str = "sandbox"  # sandbox, development, production

    BELVO_SECRET_ID: str = ""
    BELVO_SECRET_PASSWORD: str = ""
    BELVO_ENV: str = "sandbox"  # sandbox, production
    BELVO_WEBHOOK_SECRET: str = ""  # For webhook signature verification

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
