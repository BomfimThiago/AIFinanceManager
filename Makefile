# AI Finance Manager - Makefile
# Convenient commands for development and deployment

.PHONY: help install dev build test lint clean docker-build docker-run docker-stop docker-clean logs shell

# Default target
help:
	@echo "AI Finance Manager - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install     Install all dependencies (frontend + backend)"
	@echo "  make dev         Start both frontend and backend in development mode"
	@echo "  make dev-fe      Start only frontend development server"
	@echo "  make dev-be      Start only backend development server"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build       Build frontend for production"
	@echo "  make test        Run all tests"
	@echo "  make lint        Run linting on all code"
	@echo "  make typecheck   Run TypeScript type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build    Build Docker images"
	@echo "  make docker-run      Run with docker-compose (development)"
	@echo "  make docker-prod     Run in production mode"
	@echo "  make docker-stop     Stop all containers"
	@echo "  make docker-clean    Clean up containers and images"
	@echo "  make logs            Show container logs"
	@echo "  make shell           Open shell in backend container"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate      Run database migrations"
	@echo "  make db-reset        Reset database (drop and recreate)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean           Clean all build artifacts"
	@echo "  make clean-deps      Clean all dependencies"

# Installation
install:
	@echo "Installing backend dependencies..."
	cd backend && uv sync
	@echo "Installing frontend dependencies..."
	cd finance-dashboard && npm install
	@echo "All dependencies installed!"

# Development
dev:
	@echo "Starting development servers..."
	@echo "Frontend will be available at: http://localhost:5173"
	@echo "Backend will be available at: http://localhost:8001"
	@echo "Use Ctrl+C to stop both servers"
	@make -j2 dev-fe dev-be

dev-fe:
	@echo "Starting frontend development server..."
	cd finance-dashboard && npm run dev

dev-be:
	@echo "Starting backend development server..."
	cd backend && uv run python run.py

# Build
build:
	@echo "Building frontend for production..."
	cd finance-dashboard && npm run build

# Testing
test:
	@echo "Running frontend tests..."
	cd finance-dashboard && npm run test || true
	@echo "Running backend tests..."
	cd backend && uv run pytest || true

# Linting
lint:
	@echo "Running frontend linting..."
	cd finance-dashboard && npm run lint
	@echo "Running backend linting..."
	cd backend && uv run ruff check .

typecheck:
	@echo "Running TypeScript type checking..."
	cd finance-dashboard && npm run typecheck

# Docker operations (using docker-build.sh script)
docker-build:
	cd backend && ./scripts/docker-build.sh build

docker-run:
	cd backend && ./scripts/docker-build.sh run

docker-prod:
	cd backend && ./scripts/docker-build.sh prod

docker-stop:
	cd backend && ./scripts/docker-build.sh stop

docker-clean:
	cd backend && ./scripts/docker-build.sh clean

logs:
	cd backend && ./scripts/docker-build.sh logs

shell:
	cd backend && ./scripts/docker-build.sh shell

# Database operations
db-migrate:
	@echo "Running database migrations..."
	cd backend && uv run alembic upgrade head

db-reset:
	@echo "Resetting database..."
	@echo "This will drop and recreate the database. Are you sure? [y/N]" && read ans && [ $${ans:-N} = y ]
	cd backend && uv run alembic downgrade base
	cd backend && uv run alembic upgrade head

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	rm -rf finance-dashboard/dist
	rm -rf finance-dashboard/node_modules/.cache
	rm -rf backend/.pytest_cache
	rm -rf backend/__pycache__
	find backend -name "*.pyc" -delete
	find backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

clean-deps:
	@echo "Cleaning all dependencies..."
	rm -rf finance-dashboard/node_modules
	rm -rf backend/.venv
	@echo "Run 'make install' to reinstall dependencies"

# Health check
health:
	@echo "Checking application health..."
	@curl -s http://localhost:8001/health || echo "Backend not running"
	@curl -s http://localhost:5173 > /dev/null && echo "Frontend is running" || echo "Frontend not running"