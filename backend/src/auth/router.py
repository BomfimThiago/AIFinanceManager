from typing import Annotated

from fastapi import APIRouter, Depends, Request

from src.auth.dependencies import CurrentUser, get_auth_service
from src.auth.schemas import Token, UserCreate, UserLogin, UserResponse
from src.auth.service import AuthService
from src.core.rate_limiter import rate_limit_auth, rate_limit_read

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
@rate_limit_auth()
async def register(
    user_data: UserCreate,
    service: Annotated[AuthService, Depends(get_auth_service)],
    request: Request = None,
) -> UserResponse:
    user = await service.register(user_data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
@rate_limit_auth()
async def login(
    credentials: UserLogin,
    service: Annotated[AuthService, Depends(get_auth_service)],
    request: Request = None,
) -> Token:
    return await service.authenticate(credentials.email, credentials.password)


@router.get("/me", response_model=UserResponse)
@rate_limit_read()
async def get_current_user_info(
    current_user: CurrentUser,
    request: Request = None
) -> UserResponse:
    return UserResponse.model_validate(current_user)
