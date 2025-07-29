"""
Auth repository module.

This module contains the repository classes for handling
database operations related to authentication and user management.
"""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import UserModel
from src.auth.schemas import UserCreate, UserUpdate
from src.shared.repository import BaseRepository


class UserRepository(BaseRepository[UserModel, UserCreate, UserUpdate]):
    """Repository for user operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(UserModel, session)
        self.session = session

    async def get_by_email(self, email: str) -> UserModel | None:
        """Get user by email address."""
        try:
            result = await self.session.execute(
                select(UserModel).where(UserModel.email == email)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            await self.session.rollback()
            raise e

    async def get_by_username(self, username: str) -> UserModel | None:
        """Get user by username."""
        try:
            result = await self.session.execute(
                select(UserModel).where(UserModel.username == username)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            await self.session.rollback()
            raise e

    async def get_by_email_or_username(self, identifier: str) -> UserModel | None:
        """Get user by email or username."""
        try:
            result = await self.session.execute(
                select(UserModel).where(
                    (UserModel.email == identifier) | (UserModel.username == identifier)
                )
            )
            return result.scalar_one_or_none()
        except Exception as e:
            await self.session.rollback()
            raise e

    async def get_active_users(self, limit: int | None = None) -> list[UserModel]:
        """Get all active users."""
        try:
            query = select(UserModel).where(UserModel.is_active == True)
            if limit:
                query = query.limit(limit)

            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            await self.session.rollback()
            raise e

    async def get_verified_users(self, limit: int | None = None) -> list[UserModel]:
        """Get all verified users."""
        try:
            query = select(UserModel).where(UserModel.is_verified == True)
            if limit:
                query = query.limit(limit)

            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            await self.session.rollback()
            raise e

    async def get_users_by_role(
        self, role: str, limit: int | None = None
    ) -> list[UserModel]:
        """Get users by role."""
        try:
            query = select(UserModel).where(UserModel.role == role)
            if limit:
                query = query.limit(limit)

            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            await self.session.rollback()
            raise e

    async def update_login_info(
        self, user_id: int, login_count: int
    ) -> UserModel | None:
        """Update user login information."""
        try:
            await self.session.execute(
                update(UserModel)
                .where(UserModel.id == user_id)
                .values(login_count=login_count, failed_login_attempts=0)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception as e:
            await self.session.rollback()
            raise e

    async def increment_failed_login(self, user_id: int) -> UserModel | None:
        """Increment failed login attempts for user."""
        try:
            await self.session.execute(
                update(UserModel)
                .where(UserModel.id == user_id)
                .values(failed_login_attempts=UserModel.failed_login_attempts + 1)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception as e:
            await self.session.rollback()
            raise e

    async def deactivate_user(self, user_id: int) -> UserModel | None:
        """Deactivate a user account."""
        try:
            await self.session.execute(
                update(UserModel).where(UserModel.id == user_id).values(is_active=False)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception as e:
            await self.session.rollback()
            raise e

    async def activate_user(self, user_id: int) -> UserModel | None:
        """Activate a user account."""
        try:
            await self.session.execute(
                update(UserModel).where(UserModel.id == user_id).values(is_active=True)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception as e:
            await self.session.rollback()
            raise e

    async def verify_user(self, user_id: int) -> UserModel | None:
        """Verify a user account."""
        try:
            await self.session.execute(
                update(UserModel)
                .where(UserModel.id == user_id)
                .values(is_verified=True)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception as e:
            await self.session.rollback()
            raise e

    async def update_role(self, user_id: int, role: str) -> UserModel | None:
        """Update user role."""
        try:
            await self.session.execute(
                update(UserModel).where(UserModel.id == user_id).values(role=role)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception as e:
            await self.session.rollback()
            raise e

    async def count_total_users(self) -> int:
        """Count total number of users."""
        try:
            result = await self.session.execute(
                select(UserModel).where(UserModel.id.isnot(None))
            )
            return len(list(result.scalars().all()))
        except Exception as e:
            await self.session.rollback()
            raise e

    async def count_active_users(self) -> int:
        """Count active users."""
        try:
            result = await self.session.execute(
                select(UserModel).where(UserModel.is_active == True)
            )
            return len(list(result.scalars().all()))
        except Exception as e:
            await self.session.rollback()
            raise e

    async def count_verified_users(self) -> int:
        """Count verified users."""
        try:
            result = await self.session.execute(
                select(UserModel).where(UserModel.is_verified == True)
            )
            return len(list(result.scalars().all()))
        except Exception as e:
            await self.session.rollback()
            raise e
