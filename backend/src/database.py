"""
Database configuration and connection management.

This module handles database connectivity, session management,
and provides the base model for all database tables.
"""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings

logger = logging.getLogger(__name__)

# Database naming conventions
POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)


class Base(DeclarativeBase):
    """Base class for all database models."""

    metadata = metadata


# Create async engine
engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DATABASE_ECHO,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_database_session() -> AsyncGenerator[AsyncSession, None]:
    """Get database session for dependency injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_database_session_context() -> AsyncGenerator[AsyncSession, None]:
    """Get database session as context manager."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_database():
    """Initialize database tables."""
    try:
        async with engine.begin() as conn:
            # Import all models to ensure they are registered
            from .auth.models import UserModel  # noqa: F401
            from .budgets.models import BudgetModel  # noqa: F401
            from .expenses.models import ExpenseModel  # noqa: F401
            from .insights.models import InsightModel  # noqa: F401
            from .integrations.institution_models import BelvoInstitution  # noqa: F401
            from .integrations.models import (  # noqa: F401
                ConnectedAccount,
                Integration,
                SyncLog,
            )
            from .upload_history.models import UploadHistoryModel  # noqa: F401
            from .user_preferences.models import (  # noqa: F401
                UserCategoryPreference,
                UserPreferences,
            )

            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_database():
    """Close database connections."""
    await engine.dispose()
    logger.info("Database connections closed")


# Health check function
async def check_database_health() -> bool:
    """Check if database is healthy."""
    try:
        from sqlalchemy import text

        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
