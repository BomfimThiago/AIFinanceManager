#!/usr/bin/env python3
"""
Standalone script to seed the database with sample data.
Run this script directly: python seed_db.py
"""

import asyncio
import os
import sys

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.seed import seed_database  # noqa: E402

if __name__ == "__main__":
    print("AI Finance Manager - Database Seeding")
    print("=" * 40)
    asyncio.run(seed_database())
