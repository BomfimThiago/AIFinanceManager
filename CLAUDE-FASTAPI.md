# CLAUDE.md - FastAPI Backend Development Guide

> Comprehensive guidelines for AI-assisted FastAPI development.
> Based on FastAPI best practices, community standards, and production-ready patterns.

---

## 🎯 Role Definition

You are an expert in Python, FastAPI, async programming, SQLAlchemy, and scalable API development. You write clean, type-safe, and performant code following industry best practices.

---

## 📋 Key Principles

- Write concise, technical Python code with accurate examples
- Use functional, declarative programming; avoid classes where possible
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., `is_active`, `has_permission`, `can_edit`)
- Use lowercase with underscores for directories and files (e.g., `routers/user_routes.py`)
- Favor named exports for routes and utility functions
- Use the Receive Object, Return Object (RORO) pattern
- Always use type hints for all function signatures

---

## 📁 Project Structure

```
app/
├── main.py                 # FastAPI application entry point
├── api/                    # API routes
│   ├── __init__.py
│   ├── deps.py            # Shared dependencies
│   ├── v1/                # API version 1
│   │   ├── __init__.py
│   │   ├── router.py      # Main router aggregating all routes
│   │   ├── users.py       # User endpoints
│   │   ├── items.py       # Item endpoints
│   │   └── auth.py        # Authentication endpoints
│   └── v2/                # API version 2 (when needed)
├── core/                   # Core functionality
│   ├── __init__.py
│   ├── config.py          # Settings and configuration
│   ├── security.py        # Auth utilities, JWT, hashing
│   └── exceptions.py      # Custom exception classes
├── models/                 # SQLAlchemy models
│   ├── __init__.py
│   ├── base.py            # Base model class
│   ├── user.py            # User model
│   └── item.py            # Item model
├── schemas/                # Pydantic schemas
│   ├── __init__.py
│   ├── user.py            # User schemas (Create, Update, Response)
│   ├── item.py            # Item schemas
│   └── common.py          # Shared schemas (Pagination, etc.)
├── services/               # Business logic layer
│   ├── __init__.py
│   ├── user_service.py    # User business logic
│   └── item_service.py    # Item business logic
├── repositories/           # Data access layer
│   ├── __init__.py
│   ├── base.py            # Base repository
│   ├── user_repo.py       # User repository
│   └── item_repo.py       # Item repository
├── db/                     # Database configuration
│   ├── __init__.py
│   ├── session.py         # Database session management
│   └── base.py            # Import all models for Alembic
├── utils/                  # Utility functions
│   ├── __init__.py
│   └── helpers.py
└── tests/                  # Test files
    ├── __init__.py
    ├── conftest.py        # Pytest fixtures
    ├── test_users.py
    └── test_items.py
```

---

## ✅ MUST DO - Critical Rules

### Application Setup with Lifespan

```python
# ✅ CORRECT: Use lifespan context manager (not @app.on_event)
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_cache()
    yield
    # Shutdown
    await close_db()
    await close_cache()

app = FastAPI(
    title="My API",
    version="1.0.0",
    lifespan=lifespan,
)
```

### Pydantic Schemas (v2)

```python
# ✅ CORRECT: Always use Pydantic models for validation
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(None, min_length=1, max_length=100)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserResponse):
    hashed_password: str
```

### Route Handlers with Type Hints

```python
# ✅ CORRECT: Full type hints, dependency injection, proper status codes
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
) -> UserResponse:
    """Create a new user."""
    # Guard clause - check for existing user first
    existing = await user_service.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Happy path last
    user = await user_service.create(db, user_in)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get user by ID."""
    user = await user_service.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
```

### Dependency Injection

```python
# ✅ CORRECT: Reusable dependencies
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    user = await user_service.get(db, payload.sub)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user
```

### Async Database Operations

```python
# ✅ CORRECT: Async SQLAlchemy 2.0 patterns
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import select, func

class Base(DeclarativeBase):
    pass

# Engine and session factory
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Repository pattern
class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get(self, user_id: int) -> User | None:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[User]:
        result = await self.db.execute(
            select(User).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
    
    async def create(self, user_in: UserCreate) -> User:
        user = User(**user_in.model_dump())
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
```

### Error Handling Pattern

```python
# ✅ CORRECT: Custom exceptions and handlers
from fastapi import Request
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: dict | None = None,
    ):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers

class NotFoundError(AppException):
    def __init__(self, resource: str, resource_id: int | str):
        super().__init__(
            status_code=404,
            detail=f"{resource} with id {resource_id} not found",
        )

class ValidationError(AppException):
    def __init__(self, detail: str):
        super().__init__(status_code=422, detail=detail)

# Register exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )
```

### Configuration with Pydantic Settings

```python
# ✅ CORRECT: Type-safe configuration
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # App
    app_name: str = "My API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    
    # Database
    database_url: str
    db_echo: bool = False
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Redis
    redis_url: str = "redis://localhost:6379"

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### Pagination

```python
# ✅ CORRECT: Reusable pagination
from pydantic import BaseModel, Field
from typing import Generic, TypeVar

T = TypeVar("T")

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    skip: int
    limit: int
    has_more: bool

async def paginate(
    query,
    db: AsyncSession,
    params: PaginationParams,
    response_model: type[T],
) -> PaginatedResponse[T]:
    # Count total
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()
    
    # Get items
    result = await db.execute(query.offset(params.skip).limit(params.limit))
    items = list(result.scalars().all())
    
    return PaginatedResponse(
        items=items,
        total=total,
        skip=params.skip,
        limit=params.limit,
        has_more=(params.skip + len(items)) < total,
    )
```

---

## ❌ MUST NOT DO - Anti-Patterns

### Route Handler Mistakes

```python
# ❌ WRONG: Using raw dictionaries
@router.post("/users")
async def create_user(user: dict):  # No validation!
    return {"id": 1, **user}

# ❌ WRONG: Missing type hints
@router.get("/users/{user_id}")
async def get_user(user_id):  # Type unclear
    pass

# ❌ WRONG: Using @app.on_event (deprecated)
@app.on_event("startup")
async def startup():
    pass

# ❌ WRONG: Blocking operations in async functions
@router.get("/data")
async def get_data():
    time.sleep(5)  # Blocks the event loop!
    return {"data": "value"}

# ❌ WRONG: Not using proper status codes
@router.post("/users")
async def create_user(user: UserCreate):
    # Returns 200 by default, should be 201
    return user
```

### Database Anti-Patterns

```python
# ❌ WRONG: N+1 query problem
async def get_users_with_posts():
    users = await db.execute(select(User))
    for user in users.scalars():
        # Separate query for each user!
        posts = await db.execute(
            select(Post).where(Post.user_id == user.id)
        )

# ✅ CORRECT: Eager loading
async def get_users_with_posts():
    result = await db.execute(
        select(User).options(selectinload(User.posts))
    )
    return result.scalars().all()

# ❌ WRONG: SQL injection vulnerability
query = f"SELECT * FROM users WHERE email = '{email}'"
await db.execute(text(query))

# ✅ CORRECT: Parameterized queries
await db.execute(
    select(User).where(User.email == email)
)

# ❌ WRONG: Loading entire dataset
@router.get("/users")
async def list_users():
    result = await db.execute(select(User))
    return result.scalars().all()  # Could be millions!

# ✅ CORRECT: Always paginate
@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = Query(20, le=100),
):
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    return result.scalars().all()
```

### Security Issues

```python
# ❌ WRONG: Exposing internal errors
@router.get("/users/{user_id}")
async def get_user(user_id: int):
    try:
        return await service.get(user_id)
    except Exception as e:
        raise HTTPException(500, detail=str(e))  # Leaks internal info!

# ✅ CORRECT: Generic error messages
@router.get("/users/{user_id}")
async def get_user(user_id: int):
    try:
        return await service.get(user_id)
    except Exception:
        logger.exception("Error fetching user")
        raise HTTPException(500, detail="Internal server error")

# ❌ WRONG: Hardcoded secrets
SECRET_KEY = "super-secret-key-12345"
DATABASE_URL = "postgresql://user:password@localhost/db"

# ✅ CORRECT: Environment variables
from app.core.config import settings
SECRET_KEY = settings.secret_key

# ❌ WRONG: No rate limiting
@router.post("/login")
async def login(credentials: LoginRequest):
    pass  # Vulnerable to brute force

# ✅ CORRECT: Add rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    pass
```

### Code Organization Mistakes

```python
# ❌ WRONG: Business logic in routes
@router.post("/orders")
async def create_order(order_in: OrderCreate, db: AsyncSession = Depends(get_db)):
    # All this should be in a service
    user = await db.get(User, order_in.user_id)
    if not user:
        raise HTTPException(404)
    
    if user.balance < order_in.total:
        raise HTTPException(400, "Insufficient balance")
    
    user.balance -= order_in.total
    order = Order(**order_in.dict())
    db.add(order)
    await db.commit()
    
    # Send email
    await send_email(user.email, "Order confirmed")
    
    return order

# ✅ CORRECT: Thin routes, fat services
@router.post("/orders", status_code=201)
async def create_order(
    order_in: OrderCreate,
    order_service: OrderService = Depends(get_order_service),
):
    return await order_service.create(order_in)
```

---

## 🚀 Performance Optimization

### Caching with Redis

```python
from redis import asyncio as aioredis
import json

class CacheService:
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis
    
    async def get(self, key: str) -> dict | None:
        data = await self.redis.get(key)
        return json.loads(data) if data else None
    
    async def set(
        self,
        key: str,
        value: dict,
        expire: int = 3600,
    ) -> None:
        await self.redis.set(key, json.dumps(value), ex=expire)
    
    async def delete(self, key: str) -> None:
        await self.redis.delete(key)

# Usage in service
class UserService:
    async def get(self, db: AsyncSession, user_id: int) -> User | None:
        # Try cache first
        cache_key = f"user:{user_id}"
        cached = await cache.get(cache_key)
        if cached:
            return User(**cached)
        
        # Fetch from DB
        user = await self.repo.get(user_id)
        if user:
            await cache.set(cache_key, user.model_dump())
        
        return user
```

### Background Tasks

```python
from fastapi import BackgroundTasks

@router.post("/users", status_code=201)
async def create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    user = await user_service.create(db, user_in)
    
    # Non-blocking email
    background_tasks.add_task(send_welcome_email, user.email)
    
    return user

# For heavy tasks, use Celery or ARQ
from arq import create_pool
from arq.connections import RedisSettings

async def send_heavy_email(ctx, email: str, content: str):
    await email_service.send(email, content)

class WorkerSettings:
    functions = [send_heavy_email]
    redis_settings = RedisSettings()
```

### Connection Pooling

```python
# ✅ CORRECT: Configured connection pool
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,           # Connections to keep open
    max_overflow=10,       # Extra connections when needed
    pool_timeout=30,       # Seconds to wait for connection
    pool_recycle=1800,     # Recycle connections after 30 min
    pool_pre_ping=True,    # Test connections before using
)
```

---

## 🧪 Testing Guidelines

### Test Setup

```python
# conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.main import app
from app.db.session import get_db
from app.models.base import Base

@pytest.fixture
async def db_session():
    engine = create_async_engine(
        "postgresql+asyncpg://test:test@localhost/test_db",
        echo=False,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    def override_get_db():
        return db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client
    
    app.dependency_overrides.clear()
```

### API Tests

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/users",
        json={
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "securepassword123",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "password" not in data

@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    response = await client.get("/api/v1/users/99999")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient, db_session):
    # Create first user
    await client.post(
        "/api/v1/users",
        json={"email": "dup@example.com", "full_name": "First", "password": "pass1234"},
    )
    
    # Try duplicate
    response = await client.post(
        "/api/v1/users",
        json={"email": "dup@example.com", "full_name": "Second", "password": "pass1234"},
    )
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
```

---

## 🛠 Development Commands

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
uvicorn app.main:app --reload --log-level debug

# Database Migrations (Alembic)
alembic init alembic                     # Initialize Alembic
alembic revision --autogenerate -m "msg" # Create migration
alembic upgrade head                      # Apply migrations
alembic downgrade -1                      # Rollback one migration
alembic history                           # View migration history

# Testing
pytest                                    # Run all tests
pytest -v                                 # Verbose output
pytest --cov=app --cov-report=html       # With coverage
pytest -x                                 # Stop on first failure
pytest -k "test_user"                    # Run specific tests

# Code Quality
ruff check .                             # Lint code
ruff check . --fix                       # Auto-fix issues
ruff format .                            # Format code
mypy app                                 # Type checking

# Docker
docker compose up -d                     # Start services
docker compose logs -f                   # View logs
docker compose down                      # Stop services
```

---

## 🔧 Recommended Dependencies

```toml
# pyproject.toml
[project]
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.18",
    "httpx>=0.28.0",
    "redis>=5.2.0",
    "tenacity>=9.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "ruff>=0.8.0",
    "mypy>=1.13.0",
    "pre-commit>=4.0.0",
]
```

---

## 📝 Code Style Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions | snake_case | `get_user_by_id`, `create_order` |
| Variables | snake_case | `user_count`, `is_active` |
| Classes | PascalCase | `UserService`, `OrderRepository` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Files | snake_case | `user_service.py`, `auth_routes.py` |
| Directories | snake_case | `user_management/` |

### Import Order

```python
# 1. Standard library
import json
from datetime import datetime
from typing import Annotated

# 2. Third-party packages
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

# 3. Local application
from app.core.config import settings
from app.api.deps import get_db
from app.services.user_service import UserService

# 4. Type imports (if separate)
from app.models.user import User
```

### Function Structure

```python
async def create_user(
    db: AsyncSession,
    user_in: UserCreate,
    *,  # Force keyword arguments after
    send_welcome: bool = True,
) -> User:
    """
    Create a new user.
    
    Args:
        db: Database session
        user_in: User creation data
        send_welcome: Whether to send welcome email
    
    Returns:
        Created user instance
    
    Raises:
        ValidationError: If email already exists
    """
    # Guard clauses first
    existing = await get_by_email(db, user_in.email)
    if existing:
        raise ValidationError("Email already registered")
    
    # Main logic
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    
    # Side effects
    if send_welcome:
        await send_welcome_email(user.email)
    
    # Happy path return last
    return user
```

---

## 🔐 Security Checklist

- [ ] Use Pydantic for all input validation
- [ ] Implement rate limiting on sensitive endpoints
- [ ] Use parameterized queries (never string concatenation)
- [ ] Store passwords with bcrypt/argon2
- [ ] Use short-lived JWT tokens with refresh tokens
- [ ] Implement CORS properly (not `allow_origins=["*"]` in production)
- [ ] Add security headers (via middleware)
- [ ] Log security events (failed logins, permission denied)
- [ ] Use HTTPS in production
- [ ] Validate file uploads (size, type, content)
- [ ] Implement proper authentication/authorization
- [ ] Sanitize error messages (don't expose internals)

---

## 🗄️ Alembic Migration Template

```python
# alembic/env.py
from app.db.base import Base
from app.core.config import settings

config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata
```

```bash
# Create new migration
alembic revision --autogenerate -m "Add users table"

# Generated migration example
"""Add users table

Revision ID: abc123
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])

def downgrade():
    op.drop_index("ix_users_email")
    op.drop_table("users")
```

---

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic v2 Documentation](https://docs.pydantic.dev/latest/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [HTTPX Documentation](https://www.python-httpx.org/)

---

*Last Updated: January 2026*
*Compatible with: Python 3.12+, FastAPI 0.115+, Pydantic 2.10+, SQLAlchemy 2.0+*
