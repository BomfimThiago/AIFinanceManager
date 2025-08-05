"""
Unit tests for the auth service module.

Tests the AuthService, PasswordService, and TokenService classes
for authentication business logic including user registration, login,
token management, and password operations.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from src.auth.config import auth_settings
from src.auth.constants import TokenType, UserRole
from src.auth.exceptions import (
    AuthenticationError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidTokenError,
    UnverifiedUserError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from src.auth.models import UserModel
from src.auth.schemas import (
    LoginResponse,
    PasswordChange,
    RegistrationResponse,
    Token,
    TokenData,
    User,
    UserLogin,
    UserRegistration,
    UserUpdate,
)
from src.auth.service import AuthService, PasswordService, TokenService


@pytest.mark.unit
@pytest.mark.auth
class TestPasswordService:
    """Test cases for PasswordService."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed = PasswordService.hash_password(password)
        
        assert hashed != password
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = PasswordService.hash_password(password)
        
        assert PasswordService.verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = PasswordService.hash_password(password)
        
        assert PasswordService.verify_password(wrong_password, hashed) is False

    def test_hash_password_different_salts(self):
        """Test that same password produces different hashes."""
        password = "testpassword123"
        hash1 = PasswordService.hash_password(password)
        hash2 = PasswordService.hash_password(password)
        
        assert hash1 != hash2
        assert PasswordService.verify_password(password, hash1) is True
        assert PasswordService.verify_password(password, hash2) is True


@pytest.mark.unit
@pytest.mark.auth
class TestTokenService:
    """Test cases for TokenService."""

    @pytest.fixture
    def token_service(self):
        """Create a TokenService instance for testing."""
        return TokenService()

    @pytest.fixture
    def sample_user(self, test_user: UserModel):
        """Return test user for token operations."""
        return test_user

    def test_create_access_token(self, token_service: TokenService, sample_user: UserModel):
        """Test creating an access token."""
        token = token_service.create_access_token(sample_user)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_custom_expiry(
        self, token_service: TokenService, sample_user: UserModel
    ):
        """Test creating access token with custom expiry."""
        custom_delta = timedelta(hours=2)
        token = token_service.create_access_token(sample_user, custom_delta)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self, token_service: TokenService, sample_user: UserModel):
        """Test creating a refresh token."""
        token = token_service.create_refresh_token(sample_user)
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_access_token(self, token_service: TokenService, sample_user: UserModel):
        """Test verifying a valid access token."""
        token = token_service.create_access_token(sample_user)
        token_data = token_service.verify_token(token, TokenType.ACCESS)
        
        assert token_data.user_id == sample_user.id
        assert token_data.email == sample_user.email
        assert token_data.role == UserRole(sample_user.role)
        assert token_data.token_type == TokenType.ACCESS.value

    def test_verify_refresh_token(self, token_service: TokenService, sample_user: UserModel):
        """Test verifying a valid refresh token."""
        token = token_service.create_refresh_token(sample_user)
        token_data = token_service.verify_token(token, TokenType.REFRESH)
        
        assert token_data.user_id == sample_user.id
        assert token_data.email == sample_user.email
        assert token_data.role == UserRole(sample_user.role)
        assert token_data.token_type == TokenType.REFRESH.value

    def test_verify_token_wrong_type(self, token_service: TokenService, sample_user: UserModel):
        """Test verifying token with wrong type."""
        access_token = token_service.create_access_token(sample_user)
        
        with pytest.raises(InvalidTokenError, match="Invalid token type"):
            token_service.verify_token(access_token, TokenType.REFRESH)

    def test_verify_invalid_token(self, token_service: TokenService):
        """Test verifying an invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(InvalidTokenError, match="Invalid token"):
            token_service.verify_token(invalid_token, TokenType.ACCESS)

    def test_verify_expired_token(self, token_service: TokenService, sample_user: UserModel):
        """Test verifying an expired token."""
        # Create token with very short expiry
        expired_delta = timedelta(seconds=-1)
        expired_token = token_service.create_access_token(sample_user, expired_delta)
        
        with pytest.raises(InvalidTokenError, match="Token has expired"):
            token_service.verify_token(expired_token, TokenType.ACCESS)

    @patch('src.auth.service.auth_settings')
    def test_create_token_no_secret(self, mock_settings, token_service: TokenService, sample_user: UserModel):
        """Test creating token without secret key."""
        mock_settings.JWT_SECRET_KEY = None
        
        with pytest.raises(InvalidTokenError, match="JWT secret key not configured"):
            token_service.create_access_token(sample_user)

    @patch('src.auth.service.auth_settings')
    def test_verify_token_no_secret(self, mock_settings, token_service: TokenService):
        """Test verifying token without secret key."""
        mock_settings.JWT_SECRET_KEY = None
        
        with pytest.raises(InvalidTokenError, match="JWT secret key not configured"):
            token_service.verify_token("some.token", TokenType.ACCESS)


@pytest.mark.unit
@pytest.mark.auth
class TestAuthService:
    """Test cases for AuthService."""

    @pytest.mark.asyncio
    async def test_register_user_success(
        self, auth_service: AuthService, test_user_data
    ):
        """Test successful user registration."""
        registration_data = UserRegistration(
            email="newuser@example.com",
            username="newuser",
            full_name="New User",
            password="newpassword123",
        )
        
        response = await auth_service.register_user(registration_data)
        
        assert isinstance(response, RegistrationResponse)
        assert response.success is True
        assert response.message == "User registered successfully"
        assert response.user.email == registration_data.email
        assert response.user.username == registration_data.username
        assert response.user.full_name == registration_data.full_name

    @pytest.mark.asyncio
    async def test_register_user_duplicate_email(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test user registration with duplicate email."""
        registration_data = UserRegistration(
            email=test_user.email,  # Same email as existing user
            username="newuser",
            full_name="New User",
            password="newpassword123",
        )
        
        with pytest.raises(UserAlreadyExistsError, match="already exists"):
            await auth_service.register_user(registration_data)

    @pytest.mark.asyncio
    async def test_register_user_duplicate_username(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test user registration with duplicate username."""
        registration_data = UserRegistration(
            email="newuser@example.com",
            username=test_user.username,  # Same username as existing user
            full_name="New User",
            password="newpassword123",
        )
        
        with pytest.raises(UserAlreadyExistsError, match="already taken"):
            await auth_service.register_user(registration_data)

    async def test_authenticate_user_success(
        self, auth_service: AuthService, test_user: UserModel, test_user_data
    ):
        """Test successful user authentication."""
        login_data = UserLogin(
            email=test_user.email,
            password=test_user_data["password"],
        )
        
        response = await auth_service.authenticate_user(login_data)
        
        assert isinstance(response, LoginResponse)
        assert response.success is True
        assert response.message == "Login successful"
        assert response.token is not None
        assert response.token.user.id == test_user.id

    async def test_authenticate_user_invalid_email(
        self, auth_service: AuthService, test_user_data
    ):
        """Test authentication with invalid email."""
        login_data = UserLogin(
            email="nonexistent@example.com",
            password=test_user_data["password"],
        )
        
        with pytest.raises(InvalidCredentialsError, match="Invalid email or password"):
            await auth_service.authenticate_user(login_data)

    async def test_authenticate_user_invalid_password(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test authentication with invalid password."""
        login_data = UserLogin(
            email=test_user.email,
            password="wrongpassword",
        )
        
        with pytest.raises(InvalidCredentialsError, match="Invalid email or password"):
            await auth_service.authenticate_user(login_data)

    async def test_authenticate_inactive_user(
        self, auth_service: AuthService, inactive_user: UserModel, test_user_data
    ):
        """Test authentication with inactive user."""
        login_data = UserLogin(
            email=inactive_user.email,
            password=test_user_data["password"],
        )
        
        with pytest.raises(InactiveUserError, match="User account is inactive"):
            await auth_service.authenticate_user(login_data)

    @patch('src.auth.service.auth_settings')
    async def test_authenticate_unverified_user_with_verification_required(
        self, mock_settings, auth_service: AuthService, unverified_user: UserModel, test_user_data
    ):
        """Test authentication with unverified user when verification is required."""
        mock_settings.REQUIRE_EMAIL_VERIFICATION = True
        
        login_data = UserLogin(
            email=unverified_user.email,
            password=test_user_data["password"],
        )
        
        response = await auth_service.authenticate_user(login_data)
        
        assert response.success is False
        assert response.message == "Email verification required"
        assert response.requires_verification is True

    async def test_get_current_user_success(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test getting current user with valid token."""
        token = auth_service.token_service.create_access_token(test_user)
        
        user = await auth_service.get_current_user(token)
        
        assert user.id == test_user.id
        assert user.email == test_user.email
        assert user.username == test_user.username

    async def test_get_current_user_invalid_token(self, auth_service: AuthService):
        """Test getting current user with invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(InvalidTokenError):
            await auth_service.get_current_user(invalid_token)

    async def test_get_current_user_nonexistent_user(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test getting current user for nonexistent user."""
        # Create token for user that will be deleted
        token = auth_service.token_service.create_access_token(test_user)
        
        # Delete the user
        await auth_service.user_repository.delete(test_user.id)
        
        with pytest.raises(UserNotFoundError):
            await auth_service.get_current_user(token)

    async def test_update_user_success(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test successful user update."""
        update_data = UserUpdate(
            full_name="Updated Name",
            is_verified=True,
        )
        
        updated_user = await auth_service.update_user(test_user.id, update_data)
        
        assert updated_user.full_name == "Updated Name"
        assert updated_user.is_verified is True
        assert updated_user.email == test_user.email  # Unchanged

    async def test_update_user_not_found(self, auth_service: AuthService):
        """Test updating nonexistent user."""
        update_data = UserUpdate(full_name="Updated Name")
        
        with pytest.raises(UserNotFoundError):
            await auth_service.update_user(99999, update_data)

    async def test_update_user_with_password(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test updating user with new password."""
        update_data = UserUpdate(password="newpassword123")
        
        updated_user = await auth_service.update_user(test_user.id, update_data)
        
        # Verify password was updated
        assert auth_service.password_service.verify_password(
            "newpassword123", updated_user.hashed_password
        ) is True

    async def test_change_password_success(
        self, auth_service: AuthService, test_user: UserModel, test_user_data
    ):
        """Test successful password change."""
        password_data = PasswordChange(
            current_password=test_user_data["password"],
            new_password="newpassword123",
        )
        
        result = await auth_service.change_password(test_user.id, password_data)
        
        assert result is True

    async def test_change_password_wrong_current(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test password change with wrong current password."""
        password_data = PasswordChange(
            current_password="wrongpassword",
            new_password="newpassword123",
        )
        
        with pytest.raises(InvalidCredentialsError, match="Current password is incorrect"):
            await auth_service.change_password(test_user.id, password_data)

    async def test_change_password_user_not_found(self, auth_service: AuthService):
        """Test password change for nonexistent user."""
        password_data = PasswordChange(
            current_password="password",
            new_password="newpassword",
        )
        
        with pytest.raises(UserNotFoundError):
            await auth_service.change_password(99999, password_data)

    async def test_refresh_token_success(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test successful token refresh."""
        refresh_token = auth_service.token_service.create_refresh_token(test_user)
        
        new_token = await auth_service.refresh_token(refresh_token)
        
        assert isinstance(new_token, Token)
        assert new_token.access_token != refresh_token
        assert new_token.user.id == test_user.id

    async def test_refresh_token_invalid(self, auth_service: AuthService):
        """Test token refresh with invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(InvalidTokenError):
            await auth_service.refresh_token(invalid_token)

    async def test_refresh_token_inactive_user(
        self, auth_service: AuthService, inactive_user: UserModel
    ):
        """Test token refresh for inactive user."""
        refresh_token = auth_service.token_service.create_refresh_token(inactive_user)
        
        with pytest.raises(InactiveUserError):
            await auth_service.refresh_token(refresh_token)

    async def test_get_user_stats(self, auth_service: AuthService, test_user: UserModel):
        """Test getting user statistics."""
        stats = await auth_service.get_user_stats()
        
        assert stats.total_users >= 1
        assert stats.active_users >= 1
        assert stats.verified_users >= 1
        assert stats.new_users_today == 0  # TODO implementation
        assert stats.new_users_week == 0   # TODO implementation
        assert stats.new_users_month == 0  # TODO implementation

    def test_check_permission_user_role(self, auth_service: AuthService):
        """Test permission checking for user role."""
        from src.auth.constants import Permission
        
        # User should have basic permissions
        assert auth_service.check_permission(UserRole.USER, Permission.READ_OWN_DATA) is True
        assert auth_service.check_permission(UserRole.USER, Permission.WRITE_OWN_DATA) is True
        
        # User should not have admin permissions
        assert auth_service.check_permission(UserRole.USER, Permission.READ_ALL_DATA) is False
        assert auth_service.check_permission(UserRole.USER, Permission.WRITE_ALL_DATA) is False

    def test_check_permission_admin_role(self, auth_service: AuthService):
        """Test permission checking for admin role."""
        from src.auth.constants import Permission
        
        # Admin should have all permissions
        assert auth_service.check_permission(UserRole.ADMIN, Permission.READ_OWN_DATA) is True
        assert auth_service.check_permission(UserRole.ADMIN, Permission.WRITE_OWN_DATA) is True
        assert auth_service.check_permission(UserRole.ADMIN, Permission.READ_ALL_DATA) is True
        assert auth_service.check_permission(UserRole.ADMIN, Permission.WRITE_ALL_DATA) is True

    async def test_get_user_profile_success(
        self, auth_service: AuthService, test_user: UserModel
    ):
        """Test getting user profile."""
        profile = await auth_service.get_user_profile(test_user.id)
        
        assert profile.id == test_user.id
        assert profile.email == test_user.email
        assert profile.username == test_user.username
        assert profile.full_name == test_user.full_name

    async def test_get_user_profile_not_found(self, auth_service: AuthService):
        """Test getting profile for nonexistent user."""
        with pytest.raises(UserNotFoundError):
            await auth_service.get_user_profile(99999)