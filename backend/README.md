# AI Finance Manager - Backend

FastAPI backend for AI-powered home finance management with receipt scanning.

## Features

- User authentication (JWT)
- Receipt upload and AI-powered parsing (OCR + Claude)
- Expense tracking and categorization
- RESTful API

## Quick Start

```bash
# Start database
make db-up

# Install dependencies
uv sync

# Run migrations
make migrate

# Start development server
make dev
```

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/receipts/upload` - Upload receipt image
- `GET /api/v1/receipts` - List receipts
- `GET /api/v1/expenses` - List expenses
- `GET /api/v1/categories` - List categories

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Requirements

- Python 3.12+
- PostgreSQL 16+
- Tesseract OCR (for receipt scanning)
