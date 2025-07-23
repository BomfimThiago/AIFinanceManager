from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """User creation model."""
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """User update model."""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=100)


class User(UserBase):
    """User response model."""
    id: int
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """User login model."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT token model."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User


class TokenData(BaseModel):
    """Token data model for JWT payload."""
    user_id: Optional[int] = None
    email: Optional[str] = None