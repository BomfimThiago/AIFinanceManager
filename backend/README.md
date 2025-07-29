# AI Finance Manager - Backend

FastAPI backend for AI-powered personal finance management with multi-currency support and bank integrations.

## Tech Stack

- **FastAPI** - Modern async web framework
- **SQLAlchemy** - Async ORM with PostgreSQL
- **Pydantic** - Data validation and serialization
- **Alembic** - Database migrations
- **JWT** - Authentication tokens
- **Ruff** - Code linting and formatting
- **uv** - Fast Python package manager

## Quick Start

### Prerequisites
- Python 3.12+
- PostgreSQL database
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   uv sync
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**
   ```bash
   # Run migrations
   uv run alembic upgrade head
   ```

4. **Start development server**
   ```bash
   uv run python run.py
   ```

Server runs on http://localhost:8001

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/finance_db

# Optional
ENVIRONMENT=development                    # development/production
CORS_ORIGINS=http://localhost:5173        # Frontend URLs
BELVO_SECRET_ID=your_belvo_secret_id      # For bank integrations
BELVO_SECRET_PASSWORD=your_belvo_password
```

## Development Commands

```bash
# Install dependencies
uv sync

# Start server with hot reload
uv run python run.py

# Run linter and formatter
./scripts/lint.sh

# Database migrations
uv run alembic revision --autogenerate -m "descriptive_slug"
uv run alembic upgrade head

# Migration naming: YYYY-MM-DD_descriptive_slug.py
# Example: 2025-01-29_add_user_preferences.py

# Run tests (when available)
uv run pytest
```

## Project Structure

```
backend/src/
├── auth/          # Authentication & user management
├── expenses/      # Expense tracking & receipt processing
├── budgets/       # Budget management
├── insights/      # AI-powered financial insights
├── integrations/  # Bank integrations (Belvo)
├── currency/      # Multi-currency support
├── shared/        # Shared models & utilities
└── database/      # Database configuration
```

## API Documentation

- Development: http://localhost:8001/docs (Swagger UI)
- OpenAPI spec: http://localhost:8001/openapi.json

## Database Migrations

### Migration Naming Convention
- **Format**: `YYYY-MM-DD_descriptive_slug.py`
- **Example**: `2025-01-29_add_user_preferences.py`
- **Rules**: 
  - Use descriptive slugs that explain the changes
  - Migrations must be static and fully revertable
  - Only data should be dynamic, not structure

### Creating Migrations
```bash
# Generate migration with descriptive name
uv run alembic revision --autogenerate -m "add_user_preferences"

# Apply migrations
uv run alembic upgrade head

# Rollback if needed
uv run alembic downgrade -1
```

## Code Quality

This project follows strict coding standards:

- **Ruff** for linting and formatting
- **Type hints** for all functions
- **Pydantic models** for data validation
- **Absolute imports** (`from src.module`)
- **Repository pattern** for database operations

Always run `./scripts/lint.sh` before committing.

## Key Features

- 🔐 JWT authentication with secure password hashing
- 💰 Multi-currency support (USD, EUR, BRL)
- 🤖 AI-powered receipt processing
- 🏦 Bank integrations via Belvo API
- 📊 Real-time budget tracking
- 🔄 Async database operations
- 📝 Comprehensive API documentation
- 🛡️ Security best practices

## Production Deployment

1. Set `ENVIRONMENT=production` in your environment
2. Configure proper database URL
3. Set up CORS origins for your frontend domain
4. Use a production ASGI server like Gunicorn with Uvicorn workers

## Contributing

1. Follow the coding standards in `CLAUDE.md`
2. Run `./scripts/lint.sh` before committing
3. Write tests for new features
4. Update API documentation