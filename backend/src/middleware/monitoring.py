"""
Monitoring middleware for metrics collection and request tracking.
"""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.core.logging import get_logger

logger = get_logger(__name__)


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for request monitoring and metrics collection."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.app = app
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and collect metrics."""
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Log request start
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_host": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Add headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration:.2f}ms"
            
            # Log request completion
            logger.info(
                f"Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration, 2),
                    "response_size": response.headers.get("content-length", 0),
                }
            )
            
            # Collect metrics (integrate with CloudWatch or Prometheus)
            self._record_metrics(request, response, duration)
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration = (time.time() - start_time) * 1000
            
            # Log error
            logger.error(
                f"Request failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration, 2),
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
                exc_info=True
            )
            
            # Re-raise exception
            raise
    
    def _record_metrics(self, request: Request, response: Response, duration: float) -> None:
        """Record metrics for monitoring systems."""
        # This is where you would send metrics to CloudWatch, Prometheus, etc.
        # For now, we'll just log them
        
        # Group status codes
        status_group = f"{response.status_code // 100}xx"
        
        # Log metric data (in production, send to CloudWatch)
        logger.debug(
            "Metric recorded",
            extra={
                "metric_name": "http_request_duration_ms",
                "value": round(duration, 2),
                "dimensions": {
                    "method": request.method,
                    "path": self._normalize_path(request.url.path),
                    "status_code": response.status_code,
                    "status_group": status_group,
                }
            }
        )
    
    def _normalize_path(self, path: str) -> str:
        """Normalize path for metrics (remove IDs, etc.)."""
        import re
        
        # Replace UUIDs
        path = re.sub(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '{id}', path)
        
        # Replace numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        
        return path


class HealthCheckMiddleware:
    """Skip logging for health check endpoints."""
    
    def __init__(self, app: ASGIApp):
        self.app = app
        self.health_paths = {"/health", "/ready", "/live"}
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["path"] in self.health_paths:
            # Skip logging for health checks
            await self.app(scope, receive, send)
        else:
            # Normal processing
            await self.app(scope, receive, send)