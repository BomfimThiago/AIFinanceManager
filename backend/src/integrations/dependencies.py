"""
Integration module dependencies.

This module contains dependency injection functions specific to
the integrations module.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_active_user
from src.auth.schemas import User
from src.integrations.models import Integration
from src.integrations.repository import (
    ConnectedAccountRepository,
    IntegrationRepository,
    SyncLogRepository,
)
from src.integrations.service import IntegrationService
from src.shared.dependencies import get_db


async def get_integration_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IntegrationRepository:
    """Get integration repository dependency."""
    return IntegrationRepository(db)


async def get_connected_account_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConnectedAccountRepository:
    """Get connected account repository dependency."""
    return ConnectedAccountRepository(db)


async def get_sync_log_repository(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SyncLogRepository:
    """Get sync log repository dependency."""
    return SyncLogRepository(db)


async def get_integration_service(
    repository: Annotated[IntegrationRepository, Depends(get_integration_repository)],
) -> IntegrationService:
    """Get integration service dependency."""
    return IntegrationService(repository)


# Validation Dependencies


async def get_current_user_id(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> int:
    """Extract user ID from authenticated user."""
    return current_user.id


async def valid_integration_id(
    integration_id: int,
    repository: Annotated[IntegrationRepository, Depends(get_integration_repository)],
) -> Integration:
    """Validate that integration exists and return it."""
    integration = await repository.get_by_id(integration_id)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integration with ID {integration_id} not found",
        )
    return integration


async def valid_owned_integration(
    integration: Annotated[Integration, Depends(valid_integration_id)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> Integration:
    """Validate that integration exists and is owned by current user."""
    if integration.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this integration",
        )
    return integration


async def valid_connected_integration(
    integration: Annotated[Integration, Depends(valid_owned_integration)],
) -> Integration:
    """Validate that integration is connected and ready for operations."""
    if integration.status != "connected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integration is not connected (status: {integration.status})",
        )
    return integration


# Composite Dependencies for Common Use Cases


async def get_user_integrations_service(
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> tuple[int, IntegrationService]:
    """Get user ID and integration service for user-scoped operations."""
    return user_id, service
