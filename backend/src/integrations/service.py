"""
Integration service for business logic operations.

This module contains the business logic layer for integration operations,
including provider API interactions, transaction processing, and data synchronization.
"""

import logging
from datetime import UTC, datetime
from typing import Any

from src.integrations.constants import DEFAULT_SYNC_CONFIG, INTEGRATION_PROVIDERS
from src.integrations.exceptions import (
    IntegrationNotFound,
    ProviderUnavailable,
    SyncFailed,
)
from src.integrations.models import Integration
from src.integrations.repository import IntegrationRepository
from src.integrations.schemas import (
    IntegrationCreate,
    IntegrationFilter,
    IntegrationUpdate,
    SyncRequest,
    SyncResult,
)
from src.shared.exceptions import ValidationError

logger = logging.getLogger(__name__)


class IntegrationService:
    """Service for integration business logic."""

    def __init__(self, repository: IntegrationRepository):
        """Initialize service with required dependencies."""
        self.repository = repository

    async def create_integration(
        self, user_id: int, integration_data: IntegrationCreate
    ) -> Integration:
        """Create a new integration."""
        try:
            # Validate provider
            if integration_data.provider.value not in [
                p.value for p in INTEGRATION_PROVIDERS
            ]:
                raise ValidationError(
                    f"Unsupported provider: {integration_data.provider}"
                )

            # Check if user already has integration for this provider and institution
            existing = await self.repository.get_by_provider_and_institution(
                user_id,
                integration_data.provider.value,
                integration_data.institution_id,
            )

            if existing:
                raise ValidationError(
                    f"Integration already exists for {integration_data.provider} "
                    f"and institution {integration_data.institution_id}"
                )

            # Create integration record - minimal required fields only
            create_data = {
                "user_id": user_id,
                "provider": integration_data.provider,
                "institution_id": integration_data.institution_id,
                "institution_name": integration_data.institution_name,
                "institution_logo_url": integration_data.institution_logo_url,
                "institution_website": integration_data.institution_website,
                "institution_country": integration_data.institution_country,
                "status": "connected",
                # Map legacy fields to correct database columns
                "provider_item_id": (
                    integration_data.item_id
                    or integration_data.account_id
                    or integration_data.provider_item_id
                ),
                "provider_access_token": (
                    integration_data.access_token
                    or integration_data.provider_access_token
                ),
                "provider_refresh_token": integration_data.provider_refresh_token,
                # Sync configuration
                "sync_frequency": integration_data.sync_frequency,
                "auto_sync_enabled": integration_data.auto_sync_enabled,
                "sync_data_types": integration_data.sync_data_types
                or DEFAULT_SYNC_CONFIG["data_types"],
                "webhook_enabled": integration_data.webhook_enabled,
                # Other fields
                "connection_name": integration_data.connection_name,
                "primary_currency": integration_data.primary_currency,
                "timezone": integration_data.timezone,
                "consent_expiry_date": integration_data.consent_expiry_date,
                "permissions": integration_data.permissions,
                "provider_data": integration_data.metadata,
                "connected_at": datetime.now(UTC),
            }

            integration = await self.repository.create(create_data)
            logger.info(f"Created integration {integration.id} for user {user_id}")

            # Trigger initial sync if auto_sync is enabled
            if integration_data.auto_sync or integration_data.auto_sync_enabled:
                try:
                    await self.sync_integration(integration.id, user_id)
                except Exception as e:
                    logger.warning(
                        f"Initial sync failed for integration {integration.id}: {e}"
                    )
                    # Ensure integration status is reset to connected if initial sync fails
                    try:
                        await self.repository.update(
                            integration.id, {"status": "connected"}
                        )
                    except Exception as update_error:
                        logger.error(
                            f"Failed to reset integration status: {update_error}"
                        )

            return integration

        except Exception as e:
            logger.error(f"Error creating integration: {e}")
            raise ValidationError(f"Failed to create integration: {e!s}") from e

    async def get_user_integrations(
        self, user_id: int, filters: IntegrationFilter | None = None
    ) -> list[Integration]:
        """Get integrations for user with optional filtering."""
        integrations, total = await self.repository.get_user_integrations(
            user_id, filters
        )
        return integrations

    async def get_integration_by_id(
        self, integration_id: int, user_id: int
    ) -> Integration:
        """Get integration by ID for user."""
        integration = await self.repository.get_by_id(integration_id)
        if not integration or integration.user_id != user_id:
            raise IntegrationNotFound(integration_id)
        return integration

    async def update_integration(
        self, integration_id: int, user_id: int, update_data: IntegrationUpdate
    ) -> Integration:
        """Update integration."""
        try:
            # Verify ownership
            integration = await self.get_integration_by_id(integration_id, user_id)

            # Prepare update data
            update_dict = {}
            for field, value in update_data.model_dump(exclude_unset=True).items():
                if value is not None:
                    update_dict[field] = value

            if update_dict:
                updated_integration = await self.repository.update(
                    integration_id, update_dict
                )
                logger.info(f"Updated integration {integration_id}")
                return updated_integration

            return integration

        except IntegrationNotFound:
            raise
        except Exception as e:
            logger.error(f"Error updating integration {integration_id}: {e}")
            raise ValidationError(f"Failed to update integration: {e!s}") from e

    async def delete_integration(self, integration_id: int, user_id: int) -> bool:
        """Delete integration."""
        try:
            # Verify ownership
            await self.get_integration_by_id(integration_id, user_id)

            # Delete integration
            success = await self.repository.delete(integration_id)

            if success:
                logger.info(f"Deleted integration {integration_id}")

            return success

        except IntegrationNotFound:
            raise
        except Exception as e:
            logger.error(f"Error deleting integration {integration_id}: {e}")
            raise ValidationError(f"Failed to delete integration: {e!s}") from e

    async def sync_integration(
        self, integration_id: int, user_id: int, sync_request: SyncRequest | None = None
    ) -> SyncResult:
        """Sync data from integration provider."""
        try:
            integration = await self.get_integration_by_id(integration_id, user_id)

            if integration.status not in ["connected", "syncing"]:
                raise SyncFailed(
                    provider=integration.provider.value,
                    data_type="integration_sync",
                    reason=f"Integration {integration_id} is not available for sync (status: {integration.status})",
                )

            # Update sync status
            await self.repository.update(
                integration_id, {"status": "syncing", "last_sync_at": datetime.now(UTC)}
            )

            sync_result = SyncResult(
                success=False,
                sync_type="incremental",
                data_types=["transactions", "accounts"],
                started_at=datetime.now(UTC),
                records_processed=0,
                records_created=0,
                records_updated=0,
                records_failed=0,
                accounts_synced=0,
                transactions_synced=0,
                api_calls_made=0,
            )

            try:
                # Perform provider-specific sync
                if integration.provider.value == "belvo":
                    sync_result = await self._sync_belvo_integration(
                        integration, sync_request
                    )
                elif integration.provider.value == "plaid":
                    sync_result = await self._sync_plaid_integration(
                        integration, sync_request
                    )
                else:
                    raise ProviderUnavailable(
                        f"Sync not implemented for provider: {integration.provider}"
                    )

                # Update integration with sync results
                update_data = {
                    "status": "connected" if sync_result.success else "error",
                    "last_sync_at": sync_result.completed_at
                    if sync_result.success and sync_result.completed_at
                    else integration.last_sync_at,
                    "error_message": sync_result.error_message
                    if not sync_result.success
                    else None,
                    "sync_status": "success" if sync_result.success else "failed",
                    "sync_error_message": sync_result.error_message
                    if not sync_result.success
                    else None,
                }

                await self.repository.update(integration_id, update_data)

                logger.info(
                    f"Sync completed for integration {integration_id}: {sync_result.records_processed} records processed"
                )
                return sync_result

            except Exception as e:
                # Update integration with error
                await self.repository.update(
                    integration_id,
                    {
                        "status": "error",
                        "error_message": str(e),
                        "sync_status": "failed",
                        "sync_error_message": str(e),
                    },
                )

                sync_result.error_message = str(e)
                logger.error(f"Sync failed for integration {integration_id}: {e}")
                return sync_result

        except IntegrationNotFound:
            raise
        except SyncFailed:
            # Re-raise SyncFailed exceptions without wrapping them
            raise
        except Exception as e:
            logger.error(f"Error syncing integration {integration_id}: {e}")
            # Get integration info if possible for better error context
            try:
                integration = await self.get_integration_by_id(integration_id, user_id)
                provider = integration.provider.value
            except:
                provider = "unknown"

            raise SyncFailed(
                provider=provider, data_type="integration_sync", reason=str(e)
            ) from e

    async def get_integration_statistics(
        self, user_id: int, days: int = 30
    ) -> dict[str, Any]:
        """Get integration statistics for user."""
        try:
            stats = await self.repository.get_user_statistics(user_id, days)
            return stats

        except Exception as e:
            logger.error(f"Error getting integration statistics: {e}")
            raise ValidationError(f"Failed to get statistics: {e!s}") from e

    # Private helper methods

    async def _sync_belvo_integration(
        self, integration: Integration, sync_request: SyncRequest | None = None
    ) -> SyncResult:
        """Sync data from Belvo integration."""
        # This would integrate with the existing belvo_service
        # For now, return a placeholder result
        started_at = datetime.now(UTC)
        return SyncResult(
            success=True,
            sync_type=sync_request.sync_type if sync_request else "incremental",
            data_types=sync_request.data_types
            if sync_request and sync_request.data_types
            else ["transactions", "accounts"],
            started_at=started_at,
            completed_at=datetime.now(UTC),
            records_processed=0,
            records_created=0,
            records_updated=0,
            records_failed=0,
            accounts_synced=0,
            transactions_synced=0,
            api_calls_made=0,
        )

    async def _sync_plaid_integration(
        self, integration: Integration, sync_request: SyncRequest | None = None
    ) -> SyncResult:
        """Sync data from Plaid integration."""
        # This would integrate with plaid_service when implemented
        started_at = datetime.now(UTC)
        return SyncResult(
            success=True,
            sync_type=sync_request.sync_type if sync_request else "incremental",
            data_types=sync_request.data_types
            if sync_request and sync_request.data_types
            else ["transactions", "accounts"],
            started_at=started_at,
            completed_at=datetime.now(UTC),
            records_processed=0,
            records_created=0,
            records_updated=0,
            records_failed=0,
            accounts_synced=0,
            transactions_synced=0,
            api_calls_made=0,
        )
