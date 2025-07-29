"""
Integration repository for database operations.

This module contains repository classes for integration-related
database operations using the base repository pattern.
"""

from typing import Any

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.integrations.models import ConnectedAccount, Integration, SyncLog
from src.integrations.schemas import (
    IntegrationCreate,
    IntegrationFilter,
    IntegrationUpdate,
)
from src.shared.repository import BaseRepository


class IntegrationRepository(
    BaseRepository[Integration, IntegrationCreate, IntegrationUpdate]
):
    """Repository for integration operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Integration, db)

    async def get_by_provider_and_institution(
        self, user_id: int, provider: str, institution_id: str
    ) -> Integration | None:
        """Get integration by provider and institution for user."""
        try:
            result = await self.db.execute(
                select(Integration).where(
                    and_(
                        Integration.user_id == user_id,
                        Integration.provider == provider,
                        Integration.institution_id == institution_id,
                    )
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_by_provider_and_institution",
                table="integrations",
                details={
                    "user_id": user_id,
                    "provider": provider,
                    "institution_id": institution_id,
                    "error": str(e),
                },
            )

    async def get_by_access_token(self, access_token: str) -> Integration | None:
        """Get integration by access token."""
        try:
            result = await self.db.execute(
                select(Integration).where(
                    Integration.provider_access_token == access_token
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_by_access_token",
                table="integrations",
                details={"error": str(e)},
            )

    async def get_user_integrations(
        self,
        user_id: int,
        filters: IntegrationFilter | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[Integration], int]:
        """Get integrations for user with optional filtering."""
        try:
            # Build base query
            query = select(Integration).where(Integration.user_id == user_id)

            # Apply filters
            if filters:
                if filters.provider:
                    query = query.where(Integration.provider == filters.provider)
                if filters.status:
                    query = query.where(Integration.status == filters.status)
                if filters.institution_id:
                    query = query.where(
                        Integration.institution_id == filters.institution_id
                    )
                if filters.institution_country:
                    query = query.where(
                        Integration.institution_country == filters.institution_country
                    )
                if filters.sync_frequency:
                    query = query.where(
                        Integration.sync_frequency == filters.sync_frequency
                    )
                if filters.auto_sync_enabled is not None:
                    query = query.where(
                        Integration.auto_sync_enabled == filters.auto_sync_enabled
                    )
                if filters.webhook_enabled is not None:
                    query = query.where(
                        Integration.webhook_enabled == filters.webhook_enabled
                    )
                if filters.has_errors is not None:
                    if filters.has_errors:
                        query = query.where(Integration.error_message.isnot(None))
                    else:
                        query = query.where(Integration.error_message.is_(None))
                if filters.last_sync_before:
                    query = query.where(
                        Integration.last_sync_at < filters.last_sync_before
                    )
                if filters.last_sync_after:
                    query = query.where(
                        Integration.last_sync_at > filters.last_sync_after
                    )
                if filters.created_after:
                    query = query.where(Integration.created_at >= filters.created_after)
                if filters.created_before:
                    query = query.where(
                        Integration.created_at <= filters.created_before
                    )

            # Get total count
            count_query = select(func.count()).select_from(query.subquery())
            total_result = await self.db.execute(count_query)
            total = total_result.scalar()

            # Apply ordering and pagination
            query = query.order_by(desc(Integration.created_at))
            query = query.offset(skip).limit(limit)

            # Execute query
            result = await self.db.execute(query)
            items = list(result.scalars().all())

            return items, total

        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_user_integrations",
                table="integrations",
                details={
                    "user_id": user_id,
                    "skip": skip,
                    "limit": limit,
                    "error": str(e),
                },
            )

    async def get_by_status(self, status: str) -> list[Integration]:
        """Get all integrations with specific status."""
        try:
            result = await self.db.execute(
                select(Integration).where(Integration.status == status)
            )
            return list(result.scalars().all())
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_by_status",
                table="integrations",
                details={"status": status, "error": str(e)},
            )

    async def get_sync_candidates(self) -> list[Integration]:
        """Get integrations that are candidates for sync."""
        try:
            result = await self.db.execute(
                select(Integration).where(
                    and_(
                        Integration.status == "connected",
                        Integration.auto_sync_enabled == True,
                        Integration.consent_expiry_date.is_(None)
                        | (Integration.consent_expiry_date > func.now()),
                    )
                )
            )
            return list(result.scalars().all())
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_sync_candidates",
                table="integrations",
                details={"error": str(e)},
            )

    async def get_user_statistics(self, user_id: int, days: int = 30) -> dict[str, Any]:
        """Get integration statistics for user."""
        try:
            # Base integrations query for user
            base_query = select(Integration).where(Integration.user_id == user_id)

            # Get basic stats
            total_result = await self.db.execute(
                select(func.count()).select_from(base_query.subquery())
            )
            total_integrations = total_result.scalar()

            # Get status breakdown
            status_result = await self.db.execute(
                select(Integration.status, func.count())
                .where(Integration.user_id == user_id)
                .group_by(Integration.status)
            )
            status_breakdown = dict(status_result.all())

            # Get provider breakdown
            provider_result = await self.db.execute(
                select(Integration.provider, func.count())
                .where(Integration.user_id == user_id)
                .group_by(Integration.provider)
            )
            provider_breakdown = dict(provider_result.all())

            # Get total accounts and transactions
            accounts_result = await self.db.execute(
                select(func.sum(Integration.accounts_count)).where(
                    Integration.user_id == user_id
                )
            )
            total_accounts = accounts_result.scalar() or 0

            transactions_result = await self.db.execute(
                select(func.sum(Integration.transactions_count)).where(
                    Integration.user_id == user_id
                )
            )
            total_transactions = transactions_result.scalar() or 0

            return {
                "total_integrations": total_integrations,
                "status_breakdown": status_breakdown,
                "provider_breakdown": provider_breakdown,
                "total_accounts": total_accounts,
                "total_transactions": total_transactions,
                "connected_integrations": status_breakdown.get("connected", 0),
                "error_integrations": status_breakdown.get("error", 0),
            }

        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_user_statistics",
                table="integrations",
                details={"user_id": user_id, "days": days, "error": str(e)},
            )


class ConnectedAccountRepository(BaseRepository[ConnectedAccount, dict, dict]):
    """Repository for connected account operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(ConnectedAccount, db)

    async def get_by_integration(self, integration_id: int) -> list[ConnectedAccount]:
        """Get all accounts for an integration."""
        try:
            result = await self.db.execute(
                select(ConnectedAccount)
                .where(ConnectedAccount.integration_id == integration_id)
                .order_by(ConnectedAccount.account_name)
            )
            return list(result.scalars().all())
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_by_integration",
                table="connected_accounts",
                details={"integration_id": integration_id, "error": str(e)},
            )

    async def get_by_provider_account_id(
        self, integration_id: int, provider_account_id: str
    ) -> ConnectedAccount | None:
        """Get account by provider account ID."""
        try:
            result = await self.db.execute(
                select(ConnectedAccount).where(
                    and_(
                        ConnectedAccount.integration_id == integration_id,
                        ConnectedAccount.provider_account_id == provider_account_id,
                    )
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_by_provider_account_id",
                table="connected_accounts",
                details={
                    "integration_id": integration_id,
                    "provider_account_id": provider_account_id,
                    "error": str(e),
                },
            )

    async def get_user_accounts(self, user_id: int) -> list[ConnectedAccount]:
        """Get all accounts for a user."""
        try:
            result = await self.db.execute(
                select(ConnectedAccount)
                .where(ConnectedAccount.user_id == user_id)
                .order_by(ConnectedAccount.account_name)
            )
            return list(result.scalars().all())
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_user_accounts",
                table="connected_accounts",
                details={"user_id": user_id, "error": str(e)},
            )


class SyncLogRepository(BaseRepository[SyncLog, dict, dict]):
    """Repository for sync log operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(SyncLog, db)

    async def get_by_integration(
        self, integration_id: int, limit: int = 50
    ) -> list[SyncLog]:
        """Get recent sync logs for an integration."""
        try:
            result = await self.db.execute(
                select(SyncLog)
                .where(SyncLog.integration_id == integration_id)
                .order_by(desc(SyncLog.started_at))
                .limit(limit)
            )
            return list(result.scalars().all())
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_by_integration",
                table="sync_logs",
                details={"integration_id": integration_id, "error": str(e)},
            )

    async def get_failed_syncs(
        self, user_id: int | None = None, hours: int = 24
    ) -> list[SyncLog]:
        """Get failed sync logs."""
        try:
            query = select(SyncLog).where(SyncLog.status == "failed")

            if user_id:
                query = query.where(SyncLog.user_id == user_id)

            # Filter by time
            query = query.where(
                SyncLog.started_at >= func.now() - func.interval(f"{hours} hours")
            )

            query = query.order_by(desc(SyncLog.started_at))

            result = await self.db.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            from src.shared.exceptions import DatabaseError

            raise DatabaseError(
                operation="get_failed_syncs",
                table="sync_logs",
                details={"user_id": user_id, "hours": hours, "error": str(e)},
            )
