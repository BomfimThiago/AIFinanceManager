"""
Pytest configuration and fixtures for the backend tests.

This module provides common fixtures and configuration for all test modules,
including database setup, authentication, and mock objects.
"""

import asyncio
import os
from typing import AsyncGenerator
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from src.auth.models import UserModel
from src.auth.service import AuthService, PasswordService
from src.database import Base, get_database_session
from src.main import app

# Test database URL - using SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Clean up
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """Create a test client with database dependency override."""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_database_session] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user_data():
    """Provide test user data."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpassword123",
    }


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, test_user_data) -> UserModel:
    """Create a test user in the database."""
    user = UserModel(
        email=test_user_data["email"],
        username=test_user_data["username"],
        full_name=test_user_data["full_name"],
        hashed_password=PasswordService.hash_password(test_user_data["password"]),
        is_active=True,
        is_verified=True,
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    return user


@pytest_asyncio.fixture
async def auth_service(db_session: AsyncSession) -> AuthService:
    """Create an AuthService instance for testing."""
    return AuthService(db_session)


@pytest_asyncio.fixture
async def authenticated_headers(test_user: UserModel, auth_service: AuthService):
    """Create authentication headers for API requests."""
    access_token = auth_service.token_service.create_access_token(test_user)
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def mock_async():
    """Create a mock async function."""
    return AsyncMock()


# Auth module specific fixtures
@pytest_asyncio.fixture
async def inactive_user(db_session: AsyncSession, test_user_data) -> UserModel:
    """Create an inactive test user."""
    user = UserModel(
        email="inactive@example.com",
        username="inactiveuser",
        full_name="Inactive User",
        hashed_password=PasswordService.hash_password(test_user_data["password"]),
        is_active=False,
        is_verified=True,
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    return user


@pytest_asyncio.fixture
async def unverified_user(db_session: AsyncSession, test_user_data) -> UserModel:
    """Create an unverified test user."""
    user = UserModel(
        email="unverified@example.com",
        username="unverifieduser",
        full_name="Unverified User",
        hashed_password=PasswordService.hash_password(test_user_data["password"]),
        is_active=True,
        is_verified=False,
    )
    
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    return user


# Event loop configuration for pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()