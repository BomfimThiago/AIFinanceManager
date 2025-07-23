import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Database settings
    DATABASE_URL: str = "postgresql+asyncpg://ai_finance_user:ai_finance_password@localhost:5432/ai_finance_db"
    DATABASE_ECHO: bool = True  # Set to False in production
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()