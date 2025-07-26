from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
import asyncio
from app.core.config import settings
from app.api import expenses, budgets, insights, auth, upload_history, belvo
from app.db.connection import get_db
from app.db.repositories import BelvoInstitutionRepository
from app.services.belvo_service import belvo_service

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Finance Manager API",
    description="Backend API for AI-powered personal finance management",
    version="1.0.0"
)

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed logging."""
    logger.error(f"❌ Validation error on {request.method} {request.url}")
    logger.error(f"📋 Validation errors: {exc.errors()}")
    
    # Extract specific field errors for clearer debugging
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        message = error.get("msg", "Unknown error")
        value = error.get("input", "No input")
        logger.error(f"   🔸 Field '{field}': {message} (received: {value})")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": "Validation failed - check the request format"
        }
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(expenses.router, prefix="/api", tags=["expenses"])
app.include_router(budgets.router, prefix="/api", tags=["budgets"])
app.include_router(insights.router, prefix="/api", tags=["insights"])
app.include_router(belvo.router, prefix="/api", tags=["integrations"])
app.include_router(upload_history.router)


@app.get("/")
async def root():
    return {"message": "AI Finance Manager API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


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
            logger.info(f"📊 Found {len(existing_ids)} existing institutions in database")
            
            # Fetch institutions from Belvo API
            logger.info("🌐 Fetching institutions from Belvo API...")
            institutions_data = await belvo_service.get_institutions()
            logger.info(f"📥 Retrieved {len(institutions_data)} institutions from Belvo")
            
            # Process and save new institutions
            created_count = 0
            skipped_count = 0
            error_count = 0
            
            for institution_data in institutions_data:
                try:
                    belvo_id = institution_data.get('id')
                    
                    if not belvo_id:
                        logger.warning(f"Institution missing ID: {institution_data}")
                        error_count += 1
                        continue
                    
                    # Skip if already exists
                    if belvo_id in existing_ids:
                        skipped_count += 1
                        continue
                    
                    # Convert to our model
                    create_model = belvo_service.convert_institution_to_create_model(institution_data)
                    
                    if not create_model:
                        logger.warning(f"Failed to convert institution {belvo_id}")
                        error_count += 1
                        continue
                    
                    # Save to database
                    await repo.create(create_model)
                    created_count += 1
                    
                    # Log progress every 10 institutions
                    if created_count % 10 == 0:
                        logger.info(f"✅ Created {created_count} institutions so far...")
                    
                except Exception as e:
                    error_count += 1
                    logger.error(f"Failed to process institution {institution_data.get('id', 'unknown')}: {e}")
                    continue
            
            # Final summary
            logger.info(f"🎉 Belvo institutions population completed!")
            logger.info(f"   ✅ Created: {created_count} new institutions")
            logger.info(f"   ⏭️  Skipped: {skipped_count} existing institutions")
            logger.info(f"   ❌ Errors: {error_count} failed institutions")
            
            total_count = await repo.count()
            logger.info(f"   📊 Total institutions in database: {total_count}")
            
            break  # Exit the async generator
            
    except Exception as e:
        logger.error(f"❌ Failed to populate Belvo institutions: {e}")
        # Don't raise exception - app should still start even if this fails


@app.on_event("startup")
async def startup_event():
    """Run startup tasks."""
    logger.info("🚀 Starting up AI Finance Manager API...")
    
    # Note: Institution population removed from startup
    # Run manually via: POST /api/admin/sync-institutions if needed