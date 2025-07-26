"""
Development configuration for enhanced debugging.
"""

import logging
import sys
from datetime import datetime

def setup_debug_logging():
    """Configure comprehensive logging for debugging."""
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s | %(name)s | %(levelname)s | %(funcName)s:%(lineno)d | %(message)s'
    )
    
    simple_formatter = logging.Formatter(
        '%(levelname)s | %(name)s | %(message)s'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    
    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(detailed_formatter)
    
    # File handler for persistent logging
    file_handler = logging.FileHandler(
        f'debug_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    
    # Add handlers to root logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Configure specific loggers
    loggers_config = {
        'app': logging.DEBUG,
        'app.api': logging.DEBUG,
        'app.api.belvo': logging.DEBUG,  # Belvo API debugging
        'app.services': logging.DEBUG,
        'app.services.belvo_service': logging.DEBUG,  # Belvo service debugging
        'app.db': logging.INFO,
        'sqlalchemy.engine': logging.INFO,
        'uvicorn': logging.INFO,
        'uvicorn.access': logging.INFO,
        'fastapi': logging.DEBUG,
        'aiohttp': logging.DEBUG,  # For Belvo API calls
    }
    
    for logger_name, level in loggers_config.items():
        logger = logging.getLogger(logger_name)
        logger.setLevel(level)
    
    print("🐛 Debug logging configured")
    print(f"📁 Log file: debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

def print_debug_info():
    """Print useful debugging information."""
    print("\n" + "=" * 60)
    print("🚀 FASTAPI DEBUG SERVER")
    print("=" * 60)
    print(f"🕒 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Server URL: http://localhost:8001")
    print(f"📖 API Docs: http://localhost:8001/docs")
    print(f"🔧 ReDoc: http://localhost:8001/redoc")
    print(f"🔍 Debug mode: ENABLED")
    print(f"🔄 Hot reload: ENABLED")
    print("=" * 60)
    print("🐞 DEBUGGING TIPS:")
    print("- Set breakpoints in your IDE")
    print("- Check the debug log file for detailed logs")
    print("- Use /docs for API testing")
    print("- Belvo webhook URL: http://localhost:8001/api/belvo/webhook")
    print("- Test Belvo endpoints: /api/belvo/widget-token, /api/belvo/integrations")
    print("- Watch for Belvo API calls in the logs (aiohttp requests)")
    print("=" * 60)
    print()

# Environment variables for debugging
DEBUG_ENV_VARS = {
    'PYTHONPATH': '.',
    'ENVIRONMENT': 'development',
    'LOG_LEVEL': 'DEBUG',
    'PYTHONUNBUFFERED': '1',  # Ensure output is not buffered
}