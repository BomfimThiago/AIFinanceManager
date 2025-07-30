#!/bin/bash

# Database migration script for production
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if database URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    exit 1
fi

print_status "Running database migrations..."

# Run Alembic migrations
uv run alembic upgrade head

if [ $? -eq 0 ]; then
    print_success "Database migrations completed successfully!"
else
    print_error "Database migrations failed!"
    exit 1
fi