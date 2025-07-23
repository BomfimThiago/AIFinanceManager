# Backend - AI Finance Manager

A high-performance FastAPI backend with async/await, Pydantic validation, and AI-powered financial processing using Anthropic Claude.

## 🏗️ Architecture Overview

The backend follows a clean architecture pattern with clear separation of concerns:

```
app/
├── api/                    # API endpoints (routes)
│   ├── expenses.py        # Expense CRUD and AI processing
│   ├── budgets.py         # Budget management
│   └── insights.py        # AI insights generation
├── core/                  # Core configuration
│   └── config.py         # Settings and environment variables
├── models/                # Pydantic models
│   └── expense.py        # Data models and validation schemas
├── services/              # Business logic layer
│   └── ai_service.py     # AI processing with Anthropic Claude
├── utils/                 # Utility functions
│   └── calculations.py   # Financial calculations
└── main.py               # FastAPI application setup and CORS
```

## 🛠️ Technology Stack

- **Framework**: FastAPI 0.104+ for high-performance async API
- **Python**: 3.12+ with modern async/await patterns
- **Package Manager**: uv for ultra-fast dependency management
- **Database**: PostgreSQL with SQLAlchemy async ORM
- **Migrations**: Alembic for database schema management
- **Data Validation**: Pydantic v2 for robust type safety and validation
- **AI Integration**: Anthropic Claude API for document processing
- **Development**: Hot reload with uvicorn for rapid development

## 🚀 Quick Start

### Prerequisites
- Python 3.12 or higher
- uv package manager
- Docker and Docker Compose for PostgreSQL
- Anthropic API key for AI features

### Installation

1. **Install uv** (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. **Install dependencies**:
```bash
uv sync
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

4. **Configure environment** (`.env`):
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_URL=postgresql+asyncpg://ai_finance_user:ai_finance_password@localhost:5432/ai_finance_db
```

5. **Start PostgreSQL database**:
```bash
cd .. && docker compose up -d postgres
```

6. **Apply database migrations**:
```bash
uv run alembic upgrade head
```

7. **Seed database with sample data** (optional):
```bash
uv run python seed_db.py
```

8. **Start development server**:
```bash
uv run python run.py
```

9. **Access the API**: http://localhost:8001
10. **View API docs**: http://localhost:8001/docs (Swagger UI)

### Development Commands

```bash
# Start development server
uv run python run.py

# Database commands
docker compose up -d postgres     # Start PostgreSQL container
uv run alembic upgrade head       # Apply database migrations
uv run python seed_db.py         # Seed database with sample data

# Add new dependencies
uv add package-name

# Add development dependencies
uv add --dev package-name

# Update dependencies
uv sync --upgrade

# Run with specific Python version
uv run --python 3.12 python run.py
```

## 📚 API Documentation

### Automatic Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **OpenAPI JSON**: http://localhost:8001/openapi.json

### Core Endpoints

#### **Expense Management**

```python
# Get all expenses
GET /api/expenses
Response: List[Expense]

# Create new expense
POST /api/expenses
Body: ExpenseCreate
Response: Expense

# AI-powered file upload
POST /api/expenses/upload
Body: FormData with file
Response: Expense (extracted from document)

# Get financial summary
GET /api/expenses/summary
Response: {
  "total_income": float,
  "total_expenses": float,
  "net_amount": float,
  "category_spending": Dict[str, float]
}

# Get chart data
GET /api/expenses/charts/categories
GET /api/expenses/charts/monthly
```

#### **Budget Management**

```python
# Get all budgets
GET /api/budgets
Response: Dict[str, Budget]

# Create/update budget
POST /api/budgets
Body: BudgetCreate
Response: Budget

# Update spent amount
PUT /api/budgets/{category}/spent
Body: float (amount)
Response: Budget
```

#### **AI Insights**

```python
# Generate financial insights
POST /api/insights
Response: List[AIInsight]
```

## 🎨 Development Best Practices

### Code Structure

**✅ Recommended Patterns:**

```python
# API Route Structure
from fastapi import APIRouter, HTTPException, Depends
from app.models.expense import Expense, ExpenseCreate
from app.services.ai_service import ai_service

router = APIRouter()

@router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    """Create a new expense with proper validation."""
    try:
        # Business logic here
        return created_expense
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

**✅ Service Layer Pattern:**

```python
# services/ai_service.py
class AIService:
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process_file_with_ai(self, file_content: bytes, file_type: str) -> Optional[Expense]:
        """Process uploaded file and extract financial data."""
        try:
            # AI processing logic
            return processed_expense
        except Exception as error:
            logger.error(f"AI processing failed: {error}")
            return None
```

**✅ Pydantic Models:**

```python
# models/expense.py
from pydantic import BaseModel, Field
from typing import Optional, List, Literal

class ExpenseBase(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    amount: float = Field(..., gt=0, description="Amount must be positive")
    category: str = Field(..., min_length=1)
    description: str
    merchant: str
    type: Literal["expense", "income"]

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int

    class Config:
        from_attributes = True
```

### Error Handling

**✅ Comprehensive Error Handling:**

```python
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

@router.post("/expenses/upload")
async def upload_expense_file(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
        raise HTTPException(
            status_code=400, 
            detail="Only image and PDF files are supported"
        )
    
    try:
        file_content = await file.read()
        expense = await ai_service.process_file_with_ai(file_content, file.content_type)
        
        if not expense:
            raise HTTPException(
                status_code=400, 
                detail="Failed to process file"
            )
        
        return expense
        
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Configuration Management

**✅ Environment-based Configuration:**

```python
# core/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Async Best Practices

**✅ Proper Async Usage:**

```python
# Use async/await for I/O operations
async def process_file_with_ai(self, file_content: bytes) -> Optional[Expense]:
    # AI API call is I/O bound
    message = await self.client.messages.create(...)
    return processed_result

# Use regular functions for CPU-bound work
def calculate_category_spending(expenses: List[Expense]) -> Dict[str, float]:
    # Pure computation, no I/O
    return category_totals
```

**❌ Common Mistakes:**

```python
# Don't use async for CPU-bound operations
async def calculate_total(expenses):  # ❌ Unnecessary async
    return sum(e.amount for e in expenses)

# Don't forget await for async calls
result = ai_service.process_file(file)  # ❌ Missing await
```

## 🔌 AI Integration

### Anthropic Claude Setup

The AI service handles document processing and financial insights:

```python
class AIService:
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def process_file_with_ai(self, file_content: bytes, file_type: str) -> Optional[Expense]:
        """Extract financial data from uploaded documents."""
        try:
            base64_data = base64.b64encode(file_content).decode()

            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": file_type,
                                "data": base64_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Extract expense data as JSON..."
                        }
                    ]
                }]
            )

            # Process and validate AI response
            return self._parse_ai_response(message.content[0].text)
            
        except Exception as error:
            logger.error(f"AI processing failed: {error}")
            return None
```

### AI Response Processing

```python
def _parse_ai_response(self, response_text: str) -> Expense:
    """Parse and validate AI response."""
    # Clean up response format
    clean_response = response_text.replace("```json\n", "").replace("```", "").strip()
    
    # Parse JSON
    expense_data = json.loads(clean_response)
    
    # Validate with Pydantic
    return Expense(
        id=0,  # Will be set by the caller
        **expense_data,
        type="expense",
        source="ai-processed"
    )
```

## 📊 Data Management

### PostgreSQL Database

The application uses PostgreSQL with SQLAlchemy async ORM for data persistence:

```python
# Database models with SQLAlchemy
class ExpenseModel(Base):
    __tablename__ = "expenses"
    
    # Inherits id, created_at, updated_at from Base
    date = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    merchant = Column(String, nullable=False)
    type = Column(SQLEnum(ExpenseType), nullable=False)
    source = Column(SQLEnum(ExpenseSource), nullable=False)
    items = Column(JSON, nullable=True)
```

### Repository Pattern

Data access is handled through repository classes:

```python
# Repository for expense operations
class ExpenseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self) -> List[ExpenseModel]:
        result = await self.db.execute(select(ExpenseModel))
        return result.scalars().all()
    
    async def create(self, expense_data: ExpenseCreate) -> ExpenseModel:
        db_expense = ExpenseModel(**expense_data.dict())
        self.db.add(db_expense)
        await self.db.commit()
        await self.db.refresh(db_expense)
        return db_expense
```

### Database Migrations

Database schema changes are managed with Alembic:

```bash
# Generate new migration
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head

# Rollback migration
uv run alembic downgrade -1
```

### Database Seeding

For development, use the seeding script:

```bash
# Populate database with sample data
uv run python seed_db.py
```

## 🧪 Testing

### Unit Testing Setup

```python
# test_expenses.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_expense():
    expense_data = {
        "date": "2025-01-01",
        "amount": 100.0,
        "category": "Groceries",
        "description": "Test expense",
        "merchant": "Test Store",
        "type": "expense"
    }
    
    response = client.post("/api/expenses", json=expense_data)
    assert response.status_code == 200
    assert response.json()["amount"] == 100.0

def test_ai_file_upload():
    # Test file upload endpoint
    with open("test_receipt.pdf", "rb") as f:
        response = client.post("/api/expenses/upload", files={"file": f})
        assert response.status_code == 200
```

### Running Tests

```bash
# Install test dependencies
uv add --dev pytest pytest-asyncio httpx

# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=app
```

## 🚀 Performance Optimization

### Async Optimization

```python
# Use async for I/O bound operations
async def generate_insights(expenses: List[Expense], budgets: Dict) -> List[AIInsight]:
    # AI API call is I/O bound
    insights = await ai_service.generate_insights(expenses, budgets)
    return insights

# Use thread pool for CPU-bound work if needed
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def heavy_calculation(data):
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        result = await loop.run_in_executor(pool, cpu_intensive_function, data)
    return result
```

### Caching Strategies

```python
# Simple in-memory caching for expensive operations
from functools import lru_cache

@lru_cache(maxsize=128)
def calculate_category_totals(expenses_tuple: tuple) -> Dict[str, float]:
    """Cache expensive calculations."""
    expenses = list(expenses_tuple)  # Convert back from tuple
    return calculate_spending_by_category(expenses)

# Usage with cache
expenses_tuple = tuple(expenses)  # Convert to hashable type
cached_result = calculate_category_totals(expenses_tuple)
```

### Response Optimization

```python
# Use response models to control serialization
@router.get("/expenses/summary", response_model=ExpenseSummaryResponse)
async def get_expense_summary():
    # Only serialize fields defined in response model
    return summary_data

# Compress responses for large data
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

## 🔧 Configuration & Deployment

### Environment Configuration

```python
# Different configs for different environments
class DevelopmentConfig(Settings):
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

class ProductionConfig(Settings):
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    # Additional production settings

def get_settings():
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production":
        return ProductionConfig()
    return DevelopmentConfig()
```

### Logging Configuration

```python
# Configure structured logging
import logging
from pythonjsonlogger import jsonlogger

def setup_logging():
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    logHandler.setFormatter(formatter)
    logger = logging.getLogger()
    logger.addHandler(logHandler)
    logger.setLevel(logging.INFO)
```

### CORS Configuration

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🐛 Debugging & Monitoring

### Development Debugging

```python
# Add debug endpoints (development only)
if settings.DEBUG:
    @app.get("/debug/expenses")
    async def debug_expenses():
        return {
            "count": len(expenses_db),
            "expenses": expenses_db[:5]  # First 5 for inspection
        }
```

### Logging Best Practices

```python
import logging

logger = logging.getLogger(__name__)

@router.post("/expenses/upload")
async def upload_file(file: UploadFile):
    logger.info(f"Processing file upload: {file.filename}")
    
    try:
        result = await process_file(file)
        logger.info(f"Successfully processed file: {file.filename}")
        return result
    except Exception as e:
        logger.error(f"Failed to process file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail="Processing failed")
```

### Health Checks

```python
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with dependency status."""
    checks = {
        "database": await check_database_connection(),
        "ai_service": await check_ai_service(),
        "memory_usage": get_memory_usage()
    }
    
    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503
    
    return JSONResponse(
        status_code=status_code,
        content={"status": "healthy" if all_healthy else "unhealthy", "checks": checks}
    )
```

## 🚨 Common Issues & Solutions

### API Key Configuration

**Issue**: Anthropic API key not found
```bash
# Solution: Ensure .env file is properly configured
ANTHROPIC_API_KEY=your_actual_api_key_here
```

**Issue**: CORS errors from frontend
```bash
# Solution: Update CORS origins in .env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### File Upload Issues

**Issue**: File upload fails with large files
```python
# Solution: Configure file size limits
from fastapi import FastAPI, File, UploadFile

app = FastAPI()

# Configure max file size (default is 16MB)
app.add_middleware(
    ContentSizeLimit,
    max_content_size=50 * 1024 * 1024  # 50MB
)
```

**Issue**: PDF processing fails
```python
# Solution: Validate file type and content
@router.post("/expenses/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.content_type in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(400, "Unsupported file type")
    
    # Validate file is not empty
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "Empty file")
```

### Performance Issues

**Issue**: Slow API responses
```python
# Solution: Add timing middleware
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

## 🤝 Contributing

### Code Standards

1. **Type Hints**: Use type hints for all function parameters and returns
2. **Pydantic Models**: Define proper models for all data structures
3. **Error Handling**: Implement comprehensive error handling with appropriate HTTP status codes
4. **Documentation**: Add docstrings to all functions and classes
5. **Logging**: Add appropriate logging for debugging and monitoring

### Pull Request Checklist

- [ ] Code follows Python PEP 8 style guidelines
- [ ] All functions have proper type hints
- [ ] Pydantic models are defined for data validation
- [ ] Error handling is implemented with appropriate HTTP status codes
- [ ] Unit tests are written for new functionality
- [ ] API documentation is updated
- [ ] Environment variables are documented

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/new-endpoint

# Make changes with proper testing
uv run python run.py  # Test locally

# Run linting and formatting
uv run black app/
uv run isort app/

# Commit and push
git commit -m "Add new expense endpoint"
git push origin feature/new-endpoint
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [uv Documentation](https://docs.astral.sh/uv/)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/)
- [Python Async/Await Guide](https://docs.python.org/3/library/asyncio.html)

---

For frontend-related issues, see the [Frontend README](../finance-dashboard/README.md).
For general project information, see the [Main README](../README.md).