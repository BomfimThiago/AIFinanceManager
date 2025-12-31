from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.auth.dependencies import get_current_user
from src.auth.models import User
from src.categories.models import Category, UserCategoryPreference
from src.database import Base, get_db
from src.expenses.models import Expense
from src.main import app
from src.receipts.models import Receipt
from src.shared.constants import CategoryType, ReceiptStatus

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def async_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(async_engine):
    async_session = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        yield session


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password_123",
        full_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_user_2(db_session: AsyncSession) -> User:
    """Create a second test user for isolation tests."""
    user = User(
        email="test2@example.com",
        hashed_password="hashed_password_456",
        full_name="Test User 2",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_category(db_session: AsyncSession, test_user: User) -> Category:
    """Create a test category."""
    category = Category(
        user_id=test_user.id,
        name="Test Category",
        type=CategoryType.EXPENSE,
        icon="shopping-cart",
        color="#22c55e",
        is_default=False,
        is_hidden=False,
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def test_receipt(db_session: AsyncSession, test_user: User) -> Receipt:
    """Create a test receipt."""
    receipt = Receipt(
        user_id=test_user.id,
        image_url="https://example.com/receipt.jpg",
        status=ReceiptStatus.COMPLETED,
        store_name="Test Store",
        total_amount=Decimal("100.00"),
        currency="USD",
        purchase_date=datetime.utcnow(),
        category="groceries",
    )
    db_session.add(receipt)
    await db_session.commit()
    await db_session.refresh(receipt)
    return receipt


@pytest.fixture
async def test_expense(
    db_session: AsyncSession, test_user: User, test_receipt: Receipt
) -> Expense:
    """Create a test expense."""
    expense = Expense(
        user_id=test_user.id,
        receipt_id=test_receipt.id,
        description="Test Item",
        amount=Decimal("25.00"),
        currency="USD",
        category="groceries",
        expense_date=datetime.utcnow(),
        store_name="Test Store",
        amount_usd=Decimal("25.00"),
        amount_eur=Decimal("23.00"),
        amount_brl=Decimal("125.00"),
    )
    db_session.add(expense)
    await db_session.commit()
    await db_session.refresh(expense)
    return expense


@pytest.fixture
async def test_preference(
    db_session: AsyncSession, test_user: User
) -> UserCategoryPreference:
    """Create a test category preference."""
    preference = UserCategoryPreference(
        user_id=test_user.id,
        item_name_pattern="starbucks",
        store_name_pattern=None,
        target_category="dining",
        confidence_score=2.0,
        correction_count=2,
        original_category="groceries",
    )
    db_session.add(preference)
    await db_session.commit()
    await db_session.refresh(preference)
    return preference


@pytest.fixture
async def client(db_session: AsyncSession, test_user: User):
    """Create an authenticated test client."""

    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def mock_currency_service():
    """Mock currency conversion service."""
    with patch("src.receipts.repository.get_currency_service") as mock:
        service = AsyncMock()
        service.convert_amount.return_value = {
            "amount_usd": Decimal("25.00"),
            "amount_eur": Decimal("23.00"),
            "amount_brl": Decimal("125.00"),
        }
        mock.return_value = service
        yield service
