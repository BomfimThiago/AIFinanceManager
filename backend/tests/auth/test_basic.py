"""
Basic integration tests for auth module.

Simple tests to verify core auth functionality works correctly
without complex mocking or advanced scenarios.
"""

import pytest
from src.auth.service import PasswordService, TokenService


@pytest.mark.unit
@pytest.mark.auth
class TestBasicAuth:
    """Basic auth functionality tests."""

    def test_password_service_hash_and_verify(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        
        # Hash the password
        hashed = PasswordService.hash_password(password)
        
        # Verify it works
        assert PasswordService.verify_password(password, hashed) is True
        assert PasswordService.verify_password("wrongpassword", hashed) is False

    def test_token_service_creation(self):
        """Test token service can be created."""
        token_service = TokenService()
        assert token_service is not None
        assert hasattr(token_service, 'secret_key')
        assert hasattr(token_service, 'algorithm')

    @pytest.mark.asyncio
    async def test_repository_basic_operations(self, db_session):
        """Test basic repository operations."""
        from src.auth.repository import UserRepository
        from src.auth.schemas import UserCreate
        
        user_repository = UserRepository(db_session)
        
        # Prepare user data
        sample_user_create = UserCreate(
            email="repotest@example.com",
            username="repotest",
            full_name="Repository Test User",
            password="password123",
        )
        
        user_data = sample_user_create.model_dump()
        user_data["hashed_password"] = PasswordService.hash_password(
            user_data.pop("password")
        )

        # Create user
        created_user = await user_repository.create(user_data)
        assert created_user is not None
        assert created_user.email == sample_user_create.email

        # Get user by email
        retrieved_user = await user_repository.get_by_email(created_user.email)
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id

    @pytest.mark.asyncio
    async def test_auth_service_basic_flow(self, auth_service):
        """Test basic auth service registration flow."""
        from src.auth.schemas import UserRegistration
        
        registration_data = UserRegistration(
            email="basictest@example.com",
            username="basictest",
            full_name="Basic Test User",
            password="password123",
            terms_accepted=True,
        )
        
        # Register user
        response = await auth_service.register_user(registration_data)
        
        assert response.success is True
        assert response.user.email == registration_data.email
        assert response.user.username == registration_data.username