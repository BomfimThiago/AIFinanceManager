"""
Institution repository for managing institution data.

This module provides repository pattern for institution operations,
particularly for Belvo institutions with logo lookup support.
"""

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .institution_models import BelvoInstitution

logger = logging.getLogger(__name__)


class BelvoInstitutionRepository:
    """Repository for Belvo institution operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[BelvoInstitution]:
        """Get all Belvo institutions."""
        try:
            result = await self.db.execute(select(BelvoInstitution))
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Failed to get all institutions: {e}")
            return []

    async def get_by_belvo_id(self, belvo_id: int) -> BelvoInstitution | None:
        """Get institution by Belvo ID."""
        try:
            result = await self.db.execute(
                select(BelvoInstitution).where(BelvoInstitution.belvo_id == belvo_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to get institution by belvo_id {belvo_id}: {e}")
            return None

    async def get_by_code(self, code: str) -> BelvoInstitution | None:
        """Get institution by code."""
        try:
            result = await self.db.execute(
                select(BelvoInstitution).where(BelvoInstitution.code == code)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to get institution by code {code}: {e}")
            return None

    async def get_by_name(self, name: str) -> BelvoInstitution | None:
        """Get institution by internal name."""
        try:
            result = await self.db.execute(
                select(BelvoInstitution).where(BelvoInstitution.name == name)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to get institution by name {name}: {e}")
            return None

    async def get_by_country(self, country_code: str) -> list[BelvoInstitution]:
        """Get institutions by country code."""
        try:
            result = await self.db.execute(
                select(BelvoInstitution).where(
                    BelvoInstitution.country_code == country_code.upper()
                )
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Failed to get institutions by country {country_code}: {e}")
            return []

    async def search_by_display_name(
        self, display_name: str
    ) -> BelvoInstitution | None:
        """Search institution by display name (case-insensitive)."""
        try:
            result = await self.db.execute(
                select(BelvoInstitution).where(
                    BelvoInstitution.display_name.ilike(f"%{display_name}%")
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(
                f"Failed to search institution by display_name {display_name}: {e}"
            )
            return None

    async def get_existing_belvo_ids(self) -> list[int]:
        """Get all existing Belvo IDs to avoid duplicates during population."""
        try:
            result = await self.db.execute(select(BelvoInstitution.belvo_id))
            return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.error(f"Failed to get existing Belvo IDs: {e}")
            return []

    async def create_from_dict(self, institution_data: dict) -> BelvoInstitution | None:
        """Create institution from dictionary data."""
        try:
            institution = BelvoInstitution(**institution_data)
            self.db.add(institution)
            await self.db.commit()
            await self.db.refresh(institution)
            return institution
        except Exception as e:
            logger.error(f"Failed to create institution from dict: {e}")
            await self.db.rollback()
            return None

    async def count(self) -> int:
        """Get total count of institutions."""
        try:
            result = await self.db.execute(select(func.count(BelvoInstitution.id)))
            return result.scalar() or 0
        except Exception as e:
            logger.error(f"Failed to count institutions: {e}")
            return 0
