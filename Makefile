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
	@echo "  make lint        Run linting and auto-fix code (frontend + backend)"
	@echo "  make lint-check  Check code style without fixing"
	@echo "  make format      Format all code"
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
	@echo "Production Deployment:"
	@echo "  make validate-config    Validate production configuration"
	@echo "  make deploy-aws         Deploy to AWS with Terraform (full deployment)"
	@echo "  make deploy-infra       Deploy AWS infrastructure with Terraform"
	@echo "  make deploy-app         Deploy application only (Docker + ECS)"
	@echo "  make deploy-frontend    Deploy frontend to Netlify"
	@echo "  make terraform-plan     Plan Terraform changes"
	@echo "  make terraform-outputs  Show Terraform outputs"
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
	@echo "Starting database and development servers..."
	@echo "Starting PostgreSQL database on port 5433..."
	cd backend && docker compose up postgres -d
	@echo "Frontend will be available at: http://localhost:5173"
	@echo "Backend will be available at: http://localhost:8001"
	@echo "Use Ctrl+C to stop servers (database will keep running)"
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

# Linting and Formatting
lint:
	@echo "Running frontend linting and formatting..."
	cd finance-dashboard && npm run lint
	@echo "Running backend linting and formatting..."
	cd backend && ./scripts/lint.sh

lint-check:
	@echo "Checking frontend code style..."
	cd finance-dashboard && npm run lint:check
	@echo "Checking backend code style..."
	cd backend && uv run ruff check src

format:
	@echo "Formatting frontend code..."
	cd finance-dashboard && npm run format
	@echo "Formatting backend code..."
	cd backend && ./scripts/format.sh

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

# Production deployment commands
validate-config:
	@echo "Validating production configuration..."
	cd backend && python3 scripts/validate-config.py

deploy-aws:
	@echo "Starting full AWS deployment with Terraform..."
	@echo "This will deploy infrastructure and application to AWS"
	@echo "Make sure you have configured your AWS credentials and environment variables"
	./scripts/deploy-terraform.sh deploy

deploy-infra:
	@echo "Deploying AWS infrastructure with Terraform..."
	./scripts/deploy-terraform.sh deploy

deploy-app:
	@echo "Deploying application only (assumes infrastructure exists)..."
	@echo "Building and pushing Docker image..."
	cd terraform && terraform output -raw ecr_repository_url | xargs -I {} docker build -t {}:latest ../backend -f ../backend/Dockerfile.prod
	@echo "Updating ECS service..."
	./scripts/deploy-terraform.sh update-secrets

deploy-frontend:
	@echo "Building and deploying frontend..."
	cd finance-dashboard && npm run build
	@echo "Frontend built successfully"
	@echo "Deploy to Netlify manually or via CI/CD pipeline"
	@echo "Built files are in: finance-dashboard/dist/"

# Deployment utilities
check-aws:
	@echo "Checking AWS configuration..."
	@aws sts get-caller-identity || (echo "AWS CLI not configured. Run 'aws configure'" && exit 1)
	@echo "AWS configuration is valid"

check-env:
	@echo "Checking required environment variables..."
	@test -n "$$DATABASE_URL" || (echo "DATABASE_URL is not set" && exit 1)
	@test -n "$$SECRET_KEY" || (echo "SECRET_KEY is not set" && exit 1)
	@test -n "$$ANTHROPIC_API_KEY" || (echo "ANTHROPIC_API_KEY is not set" && exit 1)
	@echo "Required environment variables are set"

pre-deploy: check-aws check-env validate-config
	@echo "Pre-deployment checks completed successfully!"

# Quick deployment verification
verify-deployment:
	@echo "Verifying deployment..."
	@if [ -n "$$BACKEND_URL" ]; then \
		echo "Checking backend health at $$BACKEND_URL/health..."; \
		curl -f $$BACKEND_URL/health || (echo "Backend health check failed" && exit 1); \
		echo "Backend is healthy"; \
	else \
		echo "BACKEND_URL not set, skipping backend verification"; \
	fi
	@if [ -n "$$FRONTEND_URL" ]; then \
		echo "Checking frontend at $$FRONTEND_URL..."; \
		curl -f $$FRONTEND_URL > /dev/null || (echo "Frontend check failed" && exit 1); \
		echo "Frontend is accessible"; \
	else \
		echo "FRONTEND_URL not set, skipping frontend verification"; \
	fi

# Terraform-specific commands
terraform-plan:
	@echo "Planning Terraform changes..."
	./scripts/deploy-terraform.sh plan

terraform-outputs:
	@echo "Showing Terraform outputs..."
	./scripts/deploy-terraform.sh outputs

terraform-destroy:
	@echo "⚠️  WARNING: This will destroy all AWS infrastructure!"
	@echo "This action cannot be undone."
	@read -p "Are you sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || exit 1
	./scripts/deploy-terraform.sh destroy