"""
Unit tests for the auth repository module.

Tests the UserRepository class methods for database operations
including user creation, retrieval, and updates.
"""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import UserModel
from src.auth.repository import UserRepository
from src.auth.schemas import UserCreate, UserUpdate
from src.auth.service import PasswordService


@pytest.mark.unit
@pytest.mark.auth
class TestUserRepository:
    """Test cases for UserRepository."""

    @pytest.fixture
    def user_repository(self, db_session: AsyncSession) -> UserRepository:
        """Create a UserRepository instance for testing."""
        return UserRepository(db_session)

    @pytest.fixture
    def sample_user_create(self) -> UserCreate:
        """Create sample user creation data."""
        return UserCreate(
            email="newuser@example.com",
            username="newuser",
            full_name="New Test User",
            password="newpassword123",
        )

    @pytest.mark.asyncio
    async def test_create_user(
        self, user_repository: UserRepository, sample_user_create: UserCreate
    ):
        """Test creating a new user."""
        # Prepare user data with hashed password
        user_data = sample_user_create.model_dump()
        user_data["hashed_password"] = PasswordService.hash_password(
            user_data.pop("password")
        )

        # Create user via repository
        created_user = await user_repository.create(user_data)
        
        assert created_user.id is not None
        assert created_user.email == sample_user_create.email
        assert created_user.username == sample_user_create.username
        assert created_user.full_name == sample_user_create.full_name
        assert created_user.is_active is True
        assert created_user.is_verified is False
        assert created_user.created_at is not None

    @pytest.mark.asyncio
    async def test_get_by_email(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test retrieving user by email."""
        user = await user_repository.get_by_email(test_user.email)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_by_email_not_found(self, user_repository: UserRepository):
        """Test retrieving user by non-existent email."""
        user = await user_repository.get_by_email("nonexistent@example.com")
        
        assert user is None

    @pytest.mark.asyncio
    async def test_get_by_username(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test retrieving user by username."""
        user = await user_repository.get_by_username(test_user.username)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username

    @pytest.mark.asyncio
    async def test_get_by_username_not_found(self, user_repository: UserRepository):
        """Test retrieving user by non-existent username."""
        user = await user_repository.get_by_username("nonexistentuser")
        
        assert user is None

    @pytest.mark.asyncio
    async def test_get_by_email_or_username_with_email(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test retrieving user by email using email_or_username method."""
        user = await user_repository.get_by_email_or_username(test_user.email)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_by_email_or_username_with_username(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test retrieving user by username using email_or_username method."""
        user = await user_repository.get_by_email_or_username(test_user.username)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.username == test_user.username

    @pytest.mark.asyncio
    async def test_get_by_email_or_username_not_found(
        self, user_repository: UserRepository
    ):
        """Test retrieving user by non-existent identifier."""
        user = await user_repository.get_by_email_or_username("nonexistent")
        
        assert user is None

    @pytest.mark.asyncio
    async def test_get_by_id(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test retrieving user by ID."""
        user = await user_repository.get_by_id(test_user.id)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, user_repository: UserRepository):
        """Test retrieving user by non-existent ID."""
        user = await user_repository.get_by_id(99999)
        
        assert user is None

    @pytest.mark.asyncio
    async def test_update_user(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test updating user information."""
        update_data = UserUpdate(
            full_name="Updated Test User",
            is_verified=True,
        )
        
        updated_user = await user_repository.update(test_user.id, update_data)
        
        assert updated_user is not None
        assert updated_user.full_name == "Updated Test User"
        assert updated_user.is_verified is True
        assert updated_user.email == test_user.email  # Unchanged
        assert updated_user.username == test_user.username  # Unchanged

    @pytest.mark.asyncio
    async def test_update_user_not_found(self, user_repository: UserRepository):
        """Test updating non-existent user."""
        update_data = UserUpdate(full_name="Updated Name")
        
        updated_user = await user_repository.update(99999, update_data)
        
        assert updated_user is None

    @pytest.mark.asyncio
    async def test_delete_user(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test deleting a user."""
        success = await user_repository.delete(test_user.id)
        
        assert success is True
        
        # Verify user is deleted
        deleted_user = await user_repository.get_by_id(test_user.id)
        assert deleted_user is None

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, user_repository: UserRepository):
        """Test deleting non-existent user."""
        success = await user_repository.delete(99999)
        
        assert success is False

    @pytest.mark.asyncio
    async def test_list_users(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test listing users with pagination."""
        users, _ = await user_repository.get_multi(skip=0, limit=10)
        
        assert len(users) >= 1
        assert any(user.id == test_user.id for user in users)

    @pytest.mark.asyncio
    async def test_count_users(
        self, user_repository: UserRepository, test_user: UserModel
    ):
        """Test counting total users."""
        count = await user_repository.count()
        
        assert count >= 1

    @pytest.mark.asyncio
    async def test_unique_email_constraint(
        self, user_repository: UserRepository, test_user: UserModel, db_session: AsyncSession
    ):
        """Test unique email constraint."""
        duplicate_user = UserModel(
            email=test_user.email,  # Same email
            username="differentuser",
            full_name="Different User",
            hashed_password="hashedpassword",
        )
        
        with pytest.raises(IntegrityError):
            db_session.add(duplicate_user)
            await db_session.commit()

    @pytest.mark.asyncio
    async def test_unique_username_constraint(
        self, user_repository: UserRepository, test_user: UserModel, db_session: AsyncSession
    ):
        """Test unique username constraint."""
        duplicate_user = UserModel(
            email="different@example.com",
            username=test_user.username,  # Same username
            full_name="Different User",
            hashed_password="hashedpassword",
        )
        
        with pytest.raises(IntegrityError):
            db_session.add(duplicate_user)
            await db_session.commit()

    def test_user_model_repr(self, test_user: UserModel):
        """Test UserModel string representation."""
        repr_str = repr(test_user)
        
        assert f"id={test_user.id}" in repr_str
        assert f"username='{test_user.username}'" in repr_str
        assert f"email='{test_user.email}'" in repr_str