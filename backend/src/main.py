from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.auth.router import router as auth_router
from src.categories.router import router as categories_router
from src.config import get_settings
from src.expenses.router import router as expenses_router
from src.receipts.router import router as receipts_router

settings = get_settings()

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


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    yield
    # Shutdown


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


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
