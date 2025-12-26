from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.auth.models import User
from src.auth.repository import UserRepository
from src.auth.service import AuthService
from src.config import get_settings
from src.database import DbSession
from src.shared.exceptions import UnauthorizedError

settings = get_settings()
security = HTTPBearer()


def get_user_repository(db: DbSession) -> UserRepository:
    return UserRepository(db)


def get_auth_service(
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> AuthService:
    return AuthService(repository)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = int(payload.get("sub", 0))
        if not user_id:
            raise UnauthorizedError("Invalid token")
    except JWTError:
        raise UnauthorizedError("Invalid token")

    user = await repository.get_by_id(user_id)
    if not user:
        raise UnauthorizedError("User not found")

    if not user.is_active:
        raise UnauthorizedError("User account is disabled")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
