from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from src.auth.models import User
from src.auth.repository import UserRepository
from src.auth.schemas import Token, UserCreate
from src.config import get_settings
from src.shared.exceptions import BadRequestError, UnauthorizedError

settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash."""
    password_bytes = password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def register(self, user_data: UserCreate) -> User:
        existing_user = await self.repository.get_by_email(user_data.email)
        if existing_user:
            raise BadRequestError("Email already registered")

        hashed_password = hash_password(user_data.password)
        return await self.repository.create(user_data, hashed_password)

    async def authenticate(self, email: str, password: str) -> Token:
        user = await self.repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("User account is disabled")

        access_token = self._create_access_token(user.id)
        return Token(access_token=access_token)

    def _create_access_token(self, user_id: int) -> str:
        expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
