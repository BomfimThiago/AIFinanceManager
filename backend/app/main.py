from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import expenses, budgets, insights

app = FastAPI(
    title="AI Finance Manager API",
    description="Backend API for AI-powered personal finance management",
    version="1.0.0"
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
app.include_router(expenses.router, prefix="/api", tags=["expenses"])
app.include_router(budgets.router, prefix="/api", tags=["budgets"])
app.include_router(insights.router, prefix="/api", tags=["insights"])


@app.get("/")
async def root():
    return {"message": "AI Finance Manager API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}