.PHONY: help db-up db-down db-logs db-shell migrate migrate-create dev test lint format

help:
	@echo "Available commands:"
	@echo "  make db-up         - Start PostgreSQL database"
	@echo "  make db-down       - Stop PostgreSQL database"
	@echo "  make db-logs       - View database logs"
	@echo "  make db-shell      - Open PostgreSQL shell"
	@echo "  make migrate       - Run database migrations"
	@echo "  make migrate-create - Create new migration (use: make migrate-create msg='migration message')"
	@echo "  make dev           - Start development server"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linter"
	@echo "  make format        - Format code"

# Database commands
db-up:
	docker compose up -d
	@echo "Waiting for database to be ready..."
	@sleep 3
	@echo "Database is running on localhost:5432"

db-down:
	docker compose down

db-logs:
	docker compose logs -f db

db-shell:
	docker compose exec db psql -U postgres -d finance_manager

# Migration commands
migrate:
	uv run alembic upgrade head

migrate-create:
	uv run alembic revision --autogenerate -m "$(msg)"

# Development commands
dev:
	uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Testing commands
test:
	uv run pytest -v

test-cov:
	uv run pytest --cov=src --cov-report=html

# Linting commands
lint:
	uv run ruff check src tests

lint-fix:
	uv run ruff check --fix src tests

format:
	uv run ruff format src tests
	uv run ruff check --fix src tests

# Setup commands
setup: db-up
	@echo "Copying .env.example to .env..."
	@cp -n .env.example .env 2>/dev/null || true
	@echo "Installing dependencies..."
	uv sync
	@echo "Running migrations..."
	uv run alembic upgrade head
	@echo "Setup complete!"
