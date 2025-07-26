#!/usr/bin/env python3
"""
Simple debug script for the Finance Dashboard backend.
This script can be used to run the FastAPI server with debugging enabled.
"""

import os
from pathlib import Path

# Set the working directory to the backend folder
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

import uvicorn  # noqa: E402

from app.main import app  # noqa: E402

if __name__ == "__main__":
    print("Starting Finance Dashboard Backend in Debug Mode...")
    print(f"Working directory: {os.getcwd()}")
    print("Server will be available at: http://localhost:8001")
    print("API docs will be available at: http://localhost:8001/docs")

    # Run the server with debug settings
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,  # Enable auto-reload for development
        log_level="debug",  # Enable debug logging
        access_log=True,  # Enable access logging
    )
