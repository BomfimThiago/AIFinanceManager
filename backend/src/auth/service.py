"""
Auth service module.

This module contains the business logic for authentication,
including user management, password hashing, and JWT token handling.
"""

import logging
from datetime import datetime, timedelta

import bcrypt
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from .config import auth_settings
from .constants import ROLE_PERMISSIONS, Permission, TokenType, UserRole
from .exceptions import (
    AuthenticationError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidTokenError,
    UnverifiedUserError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from .models import UserModel
from .repository import UserRepository
from .schemas import (
    LoginResponse,
    PasswordChange,
    RegistrationResponse,
    Token,
    TokenData,
    User,
    UserLogin,
    UserProfile,
    UserRegistration,
    UserStats,
    UserUpdate,
)

logger = logging.getLogger(__name__)


class PasswordService:
    """Service for password hashing and verification."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


class TokenService:
    """Service for JWT token operations."""

    def __init__(self):
        self.secret_key = auth_settings.JWT_SECRET_KEY
        self.algorithm = auth_settings.JWT_ALGORITHM

    def create_access_token(
        self, user: UserModel, expires_delta: timedelta | None = None
    ) -> str:
        """Create a JWT access token."""
        if not self.secret_key:
            raise InvalidTokenError("JWT secret key not configured")

        expire = datetime.utcnow() + (
            expires_delta or auth_settings.access_token_expire_delta
        )

        permissions = ROLE_PERMISSIONS.get(UserRole(user.role), [])

        payload = {
            "sub": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role,
            "permissions": [p.value for p in permissions],
            "token_type": TokenType.ACCESS.value,
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(
        self, user: UserModel, expires_delta: timedelta | None = None
    ) -> str:
        """Create a JWT refresh token."""
        if not self.secret_key:
            raise InvalidTokenError("JWT secret key not configured")

        expire = datetime.utcnow() + (
            expires_delta or auth_settings.refresh_token_expire_delta
        )

        payload = {
            "sub": str(user.id),
            "email": user.email,
            "token_type": TokenType.REFRESH.value,
            "exp": expire,
            "iat": datetime.utcnow(),
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token: str, token_type: TokenType) -> TokenData:
        """Verify and decode a JWT token."""
        if not self.secret_key:
            raise InvalidTokenError("JWT secret key not configured")

        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Verify token type
            if payload.get("token_type") != token_type.value:
                raise InvalidTokenError("Invalid token type")

            # Extract token data
            user_id = payload.get("sub")
            if not user_id:
                raise InvalidTokenError("Token missing user ID")

            email = payload.get("email")
            if not email:
                raise InvalidTokenError("Token missing email")

            role = payload.get("role", UserRole.USER.value)
            permissions = payload.get("permissions", [])

            return TokenData(
                user_id=int(user_id),
                email=email,
                role=UserRole(role),
                permissions=permissions,
                token_type=token_type.value,
            )

        except jwt.ExpiredSignatureError:
            raise InvalidTokenError("Token has expired")
        except jwt.InvalidTokenError:
            raise InvalidTokenError("Invalid token")
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise InvalidTokenError("Token verification failed")


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repository = UserRepository(session)
        self.password_service = PasswordService()
        self.token_service = TokenService()

    async def register_user(self, user_data: UserRegistration) -> RegistrationResponse:
        """Register a new user."""
        try:
            # Check if user already exists
            existing_user = await self.user_repository.get_by_email(user_data.email)
            if existing_user:
                raise UserAlreadyExistsError(
                    f"User with email {user_data.email} already exists"
                )

            existing_username = await self.user_repository.get_by_username(
                user_data.username
            )
            if existing_username:
                raise UserAlreadyExistsError(
                    f"Username {user_data.username} is already taken"
                )

            # Hash password
            hashed_password = self.password_service.hash_password(user_data.password)

            # Create user data
            user_create_data = {
                "email": user_data.email,
                "username": user_data.username,
                "full_name": user_data.full_name,
                "hashed_password": hashed_password,
                "is_verified": not auth_settings.REQUIRE_EMAIL_VERIFICATION,
            }

            created_user = await self.user_repository.create(user_create_data)

            logger.info(f"User registered successfully: {created_user.email}")

            return RegistrationResponse(
                success=True,
                message="User registered successfully",
                user=User.model_validate(created_user),
                requires_verification=auth_settings.REQUIRE_EMAIL_VERIFICATION,
            )

        except UserAlreadyExistsError:
            raise
        except Exception as e:
            logger.error(f"Registration failed: {e}")
            raise AuthenticationError("Registration failed")

    async def authenticate_user(self, login_data: UserLogin) -> LoginResponse:
        """Authenticate a user and return tokens."""
        try:
            # Get user by email
            user = await self.user_repository.get_by_email(login_data.email)
            if not user:
                raise InvalidCredentialsError("Invalid email or password")

            # Verify password
            if not self.password_service.verify_password(
                login_data.password, user.hashed_password
            ):
                await self.user_repository.increment_failed_login(user.id)
                raise InvalidCredentialsError("Invalid email or password")

            # Check if user is active
            if not user.is_active:
                raise InactiveUserError("User account is inactive")

            # Check if verification is required
            if auth_settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
                return LoginResponse(
                    success=False,
                    message="Email verification required",
                    requires_verification=True,
                )

            # Update login info
            await self.user_repository.update_login_info(user.id, user.login_count + 1)

            # Create tokens
            access_token = self.token_service.create_access_token(user)
            refresh_token = self.token_service.create_refresh_token(user)

            token = Token(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=int(auth_settings.access_token_expire_delta.total_seconds()),
                user=User.model_validate(user),
            )

            logger.info(f"User authenticated successfully: {user.email}")

            return LoginResponse(success=True, message="Login successful", token=token)

        except (InvalidCredentialsError, InactiveUserError, UnverifiedUserError):
            raise
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            raise AuthenticationError("Authentication failed")

    async def get_current_user(self, token: str) -> User:
        """Get current user from access token."""
        try:
            token_data = self.token_service.verify_token(token, TokenType.ACCESS)
            user = await self.user_repository.get_by_id(token_data.user_id)

            if not user:
                raise UserNotFoundError("User not found")

            if not user.is_active:
                raise InactiveUserError("User account is inactive")

            return User.model_validate(user)

        except (InvalidTokenError, UserNotFoundError, InactiveUserError):
            raise
        except Exception as e:
            logger.error(f"Get current user failed: {e}")
            raise AuthenticationError("Failed to get current user")

    async def get_user_profile(self, user_id: int) -> UserProfile:
        """Get detailed user profile."""
        try:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                raise UserNotFoundError("User not found")

            return UserProfile.model_validate(user)

        except UserNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Get user profile failed: {e}")
            raise AuthenticationError("Failed to get user profile")

    async def update_user(self, user_id: int, update_data: UserUpdate) -> User:
        """Update user information."""
        try:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                raise UserNotFoundError("User not found")

            # Hash password if provided
            update_dict = update_data.model_dump(exclude_unset=True)
            if "password" in update_dict:
                update_dict["hashed_password"] = self.password_service.hash_password(
                    update_dict.pop("password")
                )

            updated_user = await self.user_repository.update(
                user_id, UserUpdate(**update_dict)
            )

            logger.info(f"User updated successfully: {updated_user.email}")

            return User.model_validate(updated_user)

        except UserNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Update user failed: {e}")
            raise AuthenticationError("Failed to update user")

    async def change_password(
        self, user_id: int, password_data: PasswordChange
    ) -> bool:
        """Change user password."""
        try:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                raise UserNotFoundError("User not found")

            # Verify current password
            if not self.password_service.verify_password(
                password_data.current_password, user.hashed_password
            ):
                raise InvalidCredentialsError("Current password is incorrect")

            # Hash new password
            new_hashed_password = self.password_service.hash_password(
                password_data.new_password
            )

            # Update password
            await self.user_repository.update(
                user_id, UserUpdate(password=new_hashed_password)
            )

            logger.info(f"Password changed successfully for user: {user.email}")

            return True

        except (UserNotFoundError, InvalidCredentialsError):
            raise
        except Exception as e:
            logger.error(f"Change password failed: {e}")
            raise AuthenticationError("Failed to change password")

    async def refresh_token(self, refresh_token: str) -> Token:
        """Refresh access token using refresh token."""
        try:
            token_data = self.token_service.verify_token(
                refresh_token, TokenType.REFRESH
            )
            user = await self.user_repository.get_by_id(token_data.user_id)

            if not user:
                raise UserNotFoundError("User not found")

            if not user.is_active:
                raise InactiveUserError("User account is inactive")

            # Create new tokens
            new_access_token = self.token_service.create_access_token(user)
            new_refresh_token = self.token_service.create_refresh_token(user)

            return Token(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                expires_in=int(auth_settings.access_token_expire_delta.total_seconds()),
                user=User.model_validate(user),
            )

        except (InvalidTokenError, UserNotFoundError, InactiveUserError):
            raise
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise AuthenticationError("Failed to refresh token")

    async def get_user_stats(self) -> UserStats:
        """Get user statistics."""
        try:
            total_users = await self.user_repository.count_total_users()
            active_users = await self.user_repository.count_active_users()
            verified_users = await self.user_repository.count_verified_users()

            # TODO: Implement date-based user counts
            new_users_today = 0
            new_users_week = 0
            new_users_month = 0

            return UserStats(
                total_users=total_users,
                active_users=active_users,
                verified_users=verified_users,
                new_users_today=new_users_today,
                new_users_week=new_users_week,
                new_users_month=new_users_month,
            )

        except Exception as e:
            logger.error(f"Get user stats failed: {e}")
            raise AuthenticationError("Failed to get user statistics")

    def check_permission(
        self, user_role: UserRole, required_permission: Permission
    ) -> bool:
        """Check if user role has required permission."""
        user_permissions = ROLE_PERMISSIONS.get(user_role, [])
        return required_permission in user_permissions
