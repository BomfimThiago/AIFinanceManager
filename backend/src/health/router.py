"""
Health check endpoints for monitoring and load balancers.
"""

import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db_session

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check() -> dict[str, Any]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT.value
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db_session)) -> dict[str, Any]:
    """Readiness check - verifies database connectivity."""
    try:
        # Test database connection
        start_time = time.time()
        result = await db.execute(text("SELECT 1"))
        db_latency = time.time() - start_time

        if result.scalar() != 1:
            raise Exception("Database query returned unexpected result")

        return {
            "status": "ready",
            "timestamp": time.time(),
            "checks": {
                "database": {
                    "status": "healthy",
                    "latency_ms": round(db_latency * 1000, 2)
                }
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "error": str(e),
                "checks": {
                    "database": {
                        "status": "unhealthy",
                        "error": str(e)
                    }
                }
            }
        )


@router.get("/live")
async def liveness_check() -> dict[str, str]:
    """Liveness check - verifies the application is running."""
    return {
        "status": "alive",
        "timestamp": str(time.time())
    }
