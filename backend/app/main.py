from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
from app.core.config import settings
from app.api import expenses, budgets, insights, auth, upload_history

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
app.include_router(upload_history.router)


@app.get("/")
async def root():
    return {"message": "AI Finance Manager API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}