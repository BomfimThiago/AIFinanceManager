"""
Auth router module.

This module contains the FastAPI router with all authentication
and user management endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.config import auth_settings
from src.auth.dependencies import (
    get_auth_service,
    get_current_user,
)
from src.auth.exceptions import (
    AuthException,
    InactiveUserError,
    InvalidCredentialsError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from src.auth.schemas import (
    LoginResponse,
    RefreshToken,
    RegistrationResponse,
    Token,
    User,
    UserLogin,
    UserRegistration,
)
from src.auth.service import AuthService
from src.shared.models import (
    ConflictResponse,
    ForbiddenResponse,
    InternalServerErrorResponse,
    UnauthorizedResponse,
    ValidationErrorResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
    description="Create a new user account with email and password authentication",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_403_FORBIDDEN: {"model": ForbiddenResponse},
        status.HTTP_409_CONFLICT: {"model": ConflictResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def register_user(
    user_data: UserRegistration, auth_service: AuthService = Depends(get_auth_service)
) -> RegistrationResponse:
    """Create a new user account with email and password authentication."""
    if not auth_settings.ALLOW_REGISTRATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User registration is disabled",
        )

    try:
        return await auth_service.register_user(user_data)
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "Registration failed",
                "error_code": "INTERNAL_SERVER_ERROR",
                "details": {},
            },
        ) from e


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user",
    description="Authenticate user with email and password, return access and refresh tokens",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_403_FORBIDDEN: {"model": ForbiddenResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def login_user(
    login_data: UserLogin, auth_service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    """Authenticate user credentials and return JWT access and refresh tokens."""
    try:
        return await auth_service.authenticate_user(login_data)
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except InactiveUserError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "Authentication failed",
                "error_code": "INTERNAL_SERVER_ERROR",
                "details": {},
            },
        ) from e


@router.post(
    "/refresh",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Generate a new access token using a valid refresh token",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def refresh_access_token(
    refresh_data: RefreshToken, auth_service: AuthService = Depends(get_auth_service)
) -> Token:
    """Generate a new access token using a valid refresh token."""
    try:
        return await auth_service.refresh_token(refresh_data.refresh_token)
    except (InvalidCredentialsError, UserNotFoundError, InactiveUserError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": str(e),
                "error_code": e.error_code,
                "details": e.details,
            },
        ) from e
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": "Token refresh failed",
                "error_code": "INTERNAL_SERVER_ERROR",
                "details": {},
            },
        ) from e


@router.get(
    "/me",
    response_model=User,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Get the profile information of the currently authenticated user",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_403_FORBIDDEN: {"model": ForbiddenResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> User:
    """Get the profile information of the currently authenticated user."""
    return current_user
