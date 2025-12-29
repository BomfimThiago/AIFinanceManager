from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from src.auth.models import User
from src.auth.router import router as auth_router
from src.categories.repository import CategoryRepository
from src.categories.router import router as categories_router
from src.config import get_settings
from src.core.logging import get_logger, setup_logging
from src.currency.service import CurrencyRatesNotAvailableError
from src.database import async_session_maker
from src.expenses.router import router as expenses_router
from src.receipts.router import router as receipts_router
from src.scheduler import start_scheduler, stop_scheduler

settings = get_settings()
logger = get_logger(__name__)

# Initialize logging
setup_logging()

# Initialize Sentry
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for tracing
        traces_sample_rate=1.0 if settings.environment == "development" else 0.2,
        # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions
        profiles_sample_rate=1.0 if settings.environment == "development" else 0.1,
        # Enable performance monitoring
        enable_tracing=True,
        # Send default PII like user IPs (disable in production if needed)
        send_default_pii=settings.environment == "development",
    )
    logger.info("Sentry initialized successfully")
else:
    logger.warning("Sentry DSN not configured - error tracking disabled")


async def initialize_categories_for_existing_users() -> None:
    """Initialize default categories for all users who don't have any."""
    async with async_session_maker() as db:
        # Get all users
        result = await db.execute(select(User))
        users = result.scalars().all()

        category_repo = CategoryRepository(db)
        initialized_count = 0

        for user in users:
            # Check if user has categories
            has_categories = await category_repo.user_has_categories(user.id)
            if not has_categories:
                await category_repo.create_defaults_for_user(user.id)
                initialized_count += 1
                logger.info(f"Initialized default categories for user {user.id}")

        if initialized_count > 0:
            logger.info(f"Initialized categories for {initialized_count} existing users")
        else:
            logger.info("All users already have categories")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info("Starting AI Finance Manager API")
    await start_scheduler()
    await initialize_categories_for_existing_users()
    yield
    # Shutdown
    stop_scheduler()
    logger.info("Shutting down AI Finance Manager API")


app = FastAPI(
    title="AI Finance Manager",
    description="AI-powered home finance management API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(receipts_router, prefix="/api/v1/receipts", tags=["Receipts"])
app.include_router(expenses_router, prefix="/api/v1/expenses", tags=["Expenses"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["Categories"])


# Exception handlers
@app.exception_handler(CurrencyRatesNotAvailableError)
async def currency_rates_error_handler(
    request: Request, exc: CurrencyRatesNotAvailableError
) -> JSONResponse:
    logger.warning(f"Currency rates not available: {exc}")
    return JSONResponse(
        status_code=503,
        content={
            "detail": str(exc),
            "error_code": "CURRENCY_RATES_UNAVAILABLE",
        },
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
