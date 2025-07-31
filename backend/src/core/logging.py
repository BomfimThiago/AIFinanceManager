"""
Production logging configuration with structured logging and CloudWatch integration.
"""

import json
import logging
import sys
import traceback
from datetime import datetime
from typing import Any, Dict

import uvicorn
from pythonjsonlogger import jsonlogger

from src.config import settings


class CloudWatchFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for CloudWatch Logs."""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Add environment info
        log_record['environment'] = settings.ENVIRONMENT.value
        log_record['service'] = 'ai-finance-manager'
        
        # Add request context if available
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id
        
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
            
        # Add error details if it's an error
        if record.exc_info:
            log_record['exception'] = self.formatException(record.exc_info)
            log_record['stack_trace'] = traceback.format_tb(record.exc_info[2])


class ProductionFilter(logging.Filter):
    """Filter sensitive information from logs."""
    
    SENSITIVE_FIELDS = {
        'password', 'secret', 'token', 'api_key', 'authorization',
        'credit_card', 'ssn', 'social_security'
    }
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Filter out sensitive information."""
        # Check message for sensitive data
        if hasattr(record, 'msg'):
            msg_lower = str(record.msg).lower()
            for field in self.SENSITIVE_FIELDS:
                if field in msg_lower:
                    record.msg = self._mask_sensitive_data(record.msg, field)
        
        # Check extra fields
        for key in list(record.__dict__.keys()):
            if key.lower() in self.SENSITIVE_FIELDS:
                record.__dict__[key] = '***REDACTED***'
                
        return True
    
    def _mask_sensitive_data(self, text: str, field: str) -> str:
        """Mask sensitive data in text."""
        import re
        pattern = rf'{field}["\']?\s*[:=]\s*["\']?([^"\'\s]+)'
        return re.sub(pattern, f'{field}=***REDACTED***', text, flags=re.IGNORECASE)


def setup_logging() -> None:
    """Configure production logging."""
    # Clear existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    
    # Create console handler with JSON formatting
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Use JSON formatter for production
    if settings.ENVIRONMENT.value.lower() == 'production':
        formatter = CloudWatchFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
        console_handler.setFormatter(formatter)
    else:
        # Use simple formatter for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(formatter)
    
    # Add production filter
    console_handler.addFilter(ProductionFilter())
    
    # Configure root logger
    root_logger.addHandler(console_handler)
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Configure specific loggers
    logging.getLogger('uvicorn').setLevel(logging.INFO)
    logging.getLogger('uvicorn.access').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('boto3').setLevel(logging.WARNING)
    logging.getLogger('botocore').setLevel(logging.WARNING)
    
    # Disable noisy loggers
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance."""
    logger = logging.getLogger(name)
    
    # Add custom methods for structured logging
    def log_with_context(level: int, message: str, **kwargs):
        extra = {}
        for key, value in kwargs.items():
            extra[key] = value
        logger.log(level, message, extra=extra)
    
    logger.log_with_context = log_with_context
    
    return logger


# Uvicorn logging configuration for production
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "src.core.logging.CloudWatchFormatter",
            "format": "%(timestamp)s %(level)s %(name)s %(message)s"
        },
        "access": {
            "()": "src.core.logging.CloudWatchFormatter",
            "format": "%(timestamp)s %(level)s %(name)s %(message)s"
        }
    },
    "filters": {
        "production_filter": {
            "()": "src.core.logging.ProductionFilter"
        }
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
            "filters": ["production_filter"]
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
            "filters": ["production_filter"]
        }
    },
    "loggers": {
        "uvicorn": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False
        },
        "uvicorn.error": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False
        },
        "uvicorn.access": {
            "handlers": ["access"],
            "level": "INFO",
            "propagate": False
        }
    }
}