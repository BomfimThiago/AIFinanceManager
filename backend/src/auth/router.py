from typing import Annotated

from fastapi import APIRouter, Depends

from src.auth.dependencies import CurrentUser, get_auth_service
from src.auth.schemas import Token, UserCreate, UserLogin, UserResponse
from src.auth.service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserCreate,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserResponse:
    user = await service.register(user_data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    return await service.authenticate(credentials.email, credentials.password)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
