"""
Auth Pydantic schemas.

This module contains all Pydantic models related to authentication,
including request/response models and data validation schemas.
"""

from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from src.auth.constants import UserRole
from src.shared.models import CustomModel, TimestampMixin


class UserBase(CustomModel):
    """Base user model with common fields."""

    email: EmailStr = Field(description="User email address")
    username: str = Field(min_length=3, max_length=50, description="Unique username")
    full_name: str = Field(min_length=1, max_length=100, description="User's full name")


class UserCreate(UserBase):
    """User creation schema."""

    password: str = Field(min_length=6, max_length=100, description="User password")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError(
                "Username can only contain letters, numbers, hyphens, and underscores"
            )
        return v.lower()


class UserUpdate(CustomModel):
    """User update schema."""

    email: EmailStr | None = Field(None, description="User email address")
    username: str | None = Field(
        None, min_length=3, max_length=50, description="Unique username"
    )
    full_name: str | None = Field(
        None, min_length=1, max_length=100, description="User's full name"
    )
    password: str | None = Field(
        None, min_length=6, max_length=100, description="User password"
    )
    is_active: bool | None = Field(None, description="User active status")
    is_verified: bool | None = Field(None, description="User verification status")

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        """Validate password strength."""
        if v is not None and len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        """Validate username format."""
        if v is not None:
            if not v.replace("_", "").replace("-", "").isalnum():
                raise ValueError(
                    "Username can only contain letters, numbers, hyphens, and underscores"
                )
            return v.lower()
        return v


class User(UserBase, TimestampMixin):
    """User response model."""

    id: int = Field(description="User ID")
    is_active: bool = Field(description="User active status")
    is_verified: bool = Field(description="User verification status")
    role: UserRole = Field(default=UserRole.USER, description="User role")

    class Config:
        from_attributes = True


class UserProfile(User):
    """Extended user profile model with additional info."""

    last_login: datetime | None = Field(None, description="Last login timestamp")
    login_count: int | None = Field(None, description="Total login count")
    failed_login_attempts: int | None = Field(None, description="Failed login attempts")


class UserLogin(CustomModel):
    """User login schema."""

    email: EmailStr = Field(description="User email address")
    password: str = Field(description="User password")


class UserRegistration(UserCreate):
    """User registration schema with additional fields."""

    terms_accepted: bool = Field(description="Terms of service acceptance")

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        """Validate terms acceptance."""
        if not v:
            raise ValueError("Terms of service must be accepted")
        return v


class PasswordChange(CustomModel):
    """Password change schema."""

    current_password: str = Field(description="Current password")
    new_password: str = Field(min_length=6, max_length=100, description="New password")
    confirm_password: str = Field(description="Password confirmation")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate password confirmation matches."""
        if (
            hasattr(info, "data")
            and "new_password" in info.data
            and v != info.data["new_password"]
        ):
            raise ValueError("Passwords do not match")
        return v


class PasswordReset(CustomModel):
    """Password reset schema."""

    email: EmailStr = Field(description="User email address")


class PasswordResetConfirm(CustomModel):
    """Password reset confirmation schema."""

    token: str = Field(description="Reset token")
    new_password: str = Field(min_length=6, max_length=100, description="New password")
    confirm_password: str = Field(description="Password confirmation")

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate password confirmation matches."""
        if (
            hasattr(info, "data")
            and "new_password" in info.data
            and v != info.data["new_password"]
        ):
            raise ValueError("Passwords do not match")
        return v


class Token(CustomModel):
    """JWT token response model."""

    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Token expiration in seconds")
    refresh_token: str | None = Field(None, description="JWT refresh token")
    user: User = Field(description="User information")


class TokenData(CustomModel):
    """Token data schema for JWT payload."""

    user_id: int = Field(description="User ID")
    email: str = Field(description="User email")
    role: UserRole = Field(description="User role")
    permissions: list[str] = Field(default_factory=list, description="User permissions")
    token_type: str = Field(description="Token type")


class RefreshToken(CustomModel):
    """Refresh token schema."""

    refresh_token: str = Field(description="Refresh token")


class EmailVerification(CustomModel):
    """Email verification schema."""

    token: str = Field(description="Verification token")


class UserStats(CustomModel):
    """User statistics schema."""

    total_users: int = Field(description="Total number of users")
    active_users: int = Field(description="Number of active users")
    verified_users: int = Field(description="Number of verified users")
    new_users_today: int = Field(description="New users registered today")
    new_users_week: int = Field(description="New users registered this week")
    new_users_month: int = Field(description="New users registered this month")


class LoginResponse(CustomModel):
    """Login response schema."""

    success: bool = Field(description="Login success status")
    message: str = Field(description="Response message")
    token: Token | None = Field(None, description="Authentication token")
    requires_verification: bool = Field(
        default=False, description="Email verification required"
    )


class RegistrationResponse(CustomModel):
    """Registration response schema."""

    success: bool = Field(description="Registration success status")
    message: str = Field(description="Response message")
    user: User | None = Field(None, description="Created user")
    requires_verification: bool = Field(
        default=False, description="Email verification required"
    )
