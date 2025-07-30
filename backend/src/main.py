"""
FastAPI application main module.

This module creates and configures the FastAPI application instance
following best practices for structure and organization.
"""

import asyncio
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.auth.router import router as auth_router
from src.budgets.router import router as budgets_router
from src.categories.router import router as categories_router
from src.categories.service import CategoryService
from src.config import settings
from src.currency.router import router as currency_router
from src.database import close_database, get_database_session, init_database, check_database_health
from src.expenses.router import router as expenses_router
from src.insights.router import router as insights_router
from src.integrations.institution_repository import BelvoInstitutionRepository
from src.integrations.router import router as integrations_router
from src.services.belvo_service import belvo_service
from src.shared.dependencies import get_db
from src.shared.exceptions import AppException
from src.shared.models import HealthResponse
from src.upload_history.router import router as upload_history_router
from src.user_preferences.router import router as preferences_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL), format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)


async def seed_default_categories():
    """Seed default categories on startup.

    This function creates the default categories if they don't exist.
    """
    try:
        logger.info("📂 Starting default categories seeding...")

        # Get database session directly
        async for db in get_database_session():
            try:
                service = CategoryService(db)

                # Seed default categories
                created_count = await service.seed_default_categories()

                if created_count > 0:
                    logger.info(f"✅ Created {created_count} default categories")
                else:
                    logger.info("ℹ️  Default categories already exist")

                break  # Exit the async generator

            finally:
                await db.close()

    except Exception as e:
        logger.error(f"❌ Failed to seed default categories: {e}")
        # Don't raise exception - app should still start even if this fails


async def populate_belvo_institutions():
    """Populate Belvo institutions table on startup.

    This function fetches all institutions from Belvo API and saves new ones
    to the database. Existing institutions are not modified.
    """
    try:
        logger.info("🏦 Starting Belvo institutions population...")

        # Get database session
        async for db in get_db():
            repo = BelvoInstitutionRepository(db)

            # Get existing institution IDs to avoid duplicates
            existing_ids = await repo.get_existing_belvo_ids()
            logger.info(
                f"📊 Found {len(existing_ids)} existing institutions in database"
            )

            # Fetch institutions from Belvo API
            logger.info("🌐 Fetching institutions from Belvo API...")
            institutions_data = await belvo_service.get_institutions()
            logger.info(
                f"📥 Retrieved {len(institutions_data)} institutions from Belvo"
            )

            # Process and save new institutions
            created_count = 0
            skipped_count = 0
            error_count = 0

            for institution_data in institutions_data:
                try:
                    belvo_id = institution_data.get("id")

                    if not belvo_id:
                        logger.warning(f"Institution missing ID: {institution_data}")
                        error_count += 1
                        continue

                    # Skip if already exists
                    if belvo_id in existing_ids:
                        skipped_count += 1
                        continue

                    # Convert to our model
                    create_data = belvo_service.convert_institution_to_create_model(
                        institution_data
                    )

                    if not create_data:
                        logger.warning(f"Failed to convert institution {belvo_id}")
                        error_count += 1
                        continue

                    # Save to database
                    await repo.create_from_dict(create_data)
                    created_count += 1

                    # Log progress every 10 institutions
                    if created_count % 10 == 0:
                        logger.info(
                            f"✅ Created {created_count} institutions so far..."
                        )

                except Exception as e:
                    error_count += 1
                    logger.error(
                        f"Failed to process institution {institution_data.get('id', 'unknown')}: {e}"
                    )
                    continue

            # Final summary
            logger.info("🎉 Belvo institutions population completed!")
            logger.info(f"   ✅ Created: {created_count} new institutions")
            logger.info(f"   ⏭️  Skipped: {skipped_count} existing institutions")
            logger.info(f"   ❌ Errors: {error_count} failed institutions")

            total_count = await repo.count()
            logger.info(f"   📊 Total institutions in database: {total_count}")

            break  # Exit the async generator

    except Exception as e:
        logger.error(f"❌ Failed to populate Belvo institutions: {e}")
        # Don't raise exception - app should still start even if this fails


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting up AI Finance Manager API")
    try:
        await init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    # Seed default categories and populate Belvo institutions in background (don't block startup)
    asyncio.create_task(seed_default_categories())
    asyncio.create_task(populate_belvo_institutions())

    yield

    # Shutdown
    logger.info("Shutting down AI Finance Manager API")
    try:
        await close_database()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI app instance with conditional documentation
app_configs = {
    "title": settings.APP_NAME,
    "version": settings.APP_VERSION,
    "description": "AI-powered personal finance management API",
    "lifespan": lifespan,
}

# Show documentation only in allowed environments
if settings.ENVIRONMENT.value.lower() in settings.show_docs_environments_list:
    app_configs.update(
        {
            "docs_url": settings.DOCS_URL,
            "redoc_url": settings.REDOC_URL,
            "openapi_url": settings.OPENAPI_URL,
        }
    )
    logger.info(
        f"📚 API documentation enabled for environment: {settings.ENVIRONMENT.value}"
    )
else:
    app_configs.update(
        {
            "docs_url": None,
            "redoc_url": None,
            "openapi_url": None,
        }
    )
    logger.info(
        f"🔒 API documentation disabled for environment: {settings.ENVIRONMENT.value}"
    )

app = FastAPI(**app_configs)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


# Global exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    """Handle application exceptions."""
    logger.error(
        f"Application error: {exc.message}",
        extra={
            "error_code": exc.error_code,
            "details": exc.details,
            "path": request.url.path,
            "method": request.method,
        },
    )

    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": exc.message,
            "error_code": exc.error_code,
            "details": exc.details,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        f"Unexpected error: {exc!s}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
        },
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "error_code": "INTERNAL_ERROR",
        },
    )


# Health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    components = {}

    # Check database
    try:
        db_healthy = await check_database_health()
        components["database"] = "healthy" if db_healthy else "unhealthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        components["database"] = "unhealthy"

    # Overall status
    overall_status = (
        "healthy"
        if all(status == "healthy" for status in components.values())
        else "unhealthy"
    )

    return HealthResponse(
        status=overall_status,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT.value,
        components=components,
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs_url": f"{settings.API_PREFIX}/docs" if settings.DOCS_URL else None,
    }


# Include routers
app.include_router(auth_router)
app.include_router(preferences_router)
app.include_router(budgets_router)
app.include_router(categories_router)
app.include_router(currency_router)
app.include_router(expenses_router)
app.include_router(insights_router)
app.include_router(upload_history_router)
app.include_router(
    integrations_router,
    prefix=settings.API_PREFIX,
)


# Compatibility endpoints removed - frontend now uses proper /api/integrations/belvo/* endpoints


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
