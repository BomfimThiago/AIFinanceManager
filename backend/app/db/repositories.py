from typing import Dict, List, Optional

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.auth import get_password_hash
from ..models.auth import User, UserCreate, UserUpdate
from ..models.belvo_institution import BelvoInstitutionCreate, BelvoInstitutionUpdate
from ..models.expense import AIInsight, Budget, BudgetCreate, Expense, ExpenseCreate
from ..models.integration import Integration, IntegrationCreate, IntegrationUpdate
from .models import (
    BelvoInstitutionModel,
    BudgetModel,
    ExpenseModel,
    ExpenseSource,
    ExpenseType,
    InsightModel,
    IntegrationModel,
    IntegrationStatus,
    IntegrationType,
    UploadHistoryModel,
    UploadStatus,
    UserModel,
)


class ExpenseRepository:
    """Repository for expense database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[ExpenseModel]:
        """Get all expenses."""
        result = await self.db.execute(select(ExpenseModel))
        return result.scalars().all()

    async def get_by_id(self, expense_id: int) -> Optional[ExpenseModel]:
        """Get expense by ID."""
        result = await self.db.execute(
            select(ExpenseModel).where(ExpenseModel.id == expense_id)
        )
        return result.scalar_one_or_none()

    async def create(self, expense_data: ExpenseCreate) -> ExpenseModel:
        """Create a new expense."""
        db_expense = ExpenseModel(
            date=expense_data.date,
            amount=expense_data.amount,
            category=expense_data.category,
            description=expense_data.description,
            merchant=expense_data.merchant,
            type=ExpenseType(expense_data.type),
            source=(
                ExpenseSource(expense_data.source)
                if expense_data.source
                else ExpenseSource.MANUAL
            ),
            items=expense_data.items,
            # Multi-currency fields
            original_currency=expense_data.original_currency or "EUR",
            amounts=expense_data.amounts,
            exchange_rates=expense_data.exchange_rates,
            exchange_date=expense_data.exchange_date,
        )
        self.db.add(db_expense)
        await self.db.commit()
        await self.db.refresh(db_expense)
        return db_expense

    async def update(
        self, expense_id: int, expense_data: ExpenseCreate
    ) -> Optional[ExpenseModel]:
        """Update an expense."""
        result = await self.db.execute(
            update(ExpenseModel)
            .where(ExpenseModel.id == expense_id)
            .values(
                date=expense_data.date,
                amount=expense_data.amount,
                category=expense_data.category,
                description=expense_data.description,
                merchant=expense_data.merchant,
                type=ExpenseType(expense_data.type),
                source=(
                    ExpenseSource(expense_data.source)
                    if expense_data.source
                    else ExpenseSource.MANUAL
                ),
                items=expense_data.items,
                # Multi-currency fields
                original_currency=expense_data.original_currency or "EUR",
                amounts=expense_data.amounts,
                exchange_rates=expense_data.exchange_rates,
                exchange_date=expense_data.exchange_date,
            )
            .returning(ExpenseModel)
        )
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete(self, expense_id: int) -> bool:
        """Delete an expense."""
        result = await self.db.execute(
            delete(ExpenseModel).where(ExpenseModel.id == expense_id)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_by_category(self, category: str) -> List[ExpenseModel]:
        """Get expenses by category."""
        result = await self.db.execute(
            select(ExpenseModel).where(ExpenseModel.category == category)
        )
        return result.scalars().all()

    async def get_by_date_filter(
        self, month: Optional[int] = None, year: Optional[int] = None
    ) -> List[ExpenseModel]:
        """Get expenses filtered by month and/or year."""
        query = select(ExpenseModel)

        if year is not None and month is not None:
            # Filter by specific year and month
            month_str = f"{month:02d}"
            query = query.where(ExpenseModel.date.like(f"{year}-{month_str}-%"))
        elif year is not None:
            # Filter by year only
            query = query.where(ExpenseModel.date.like(f"{year}-%"))
        elif month is not None:
            # Filter by month across all years
            month_str = f"{month:02d}"
            query = query.where(ExpenseModel.date.like(f"%-{month_str}-%"))

        # Order by date descending
        query = query.order_by(ExpenseModel.date.desc())

        result = await self.db.execute(query)
        return result.scalars().all()


class BudgetRepository:
    """Repository for budget database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[BudgetModel]:
        """Get all budgets."""
        result = await self.db.execute(select(BudgetModel))
        return result.scalars().all()

    async def get_by_category(self, category: str) -> Optional[BudgetModel]:
        """Get budget by category."""
        result = await self.db.execute(
            select(BudgetModel).where(BudgetModel.category == category)
        )
        return result.scalar_one_or_none()

    async def create_or_update(self, budget_data: BudgetCreate) -> BudgetModel:
        """Create or update a budget."""
        existing = await self.get_by_category(budget_data.category)

        if existing:
            # Update existing budget
            result = await self.db.execute(
                update(BudgetModel)
                .where(BudgetModel.category == budget_data.category)
                .values(limit_amount=budget_data.limit)
                .returning(BudgetModel)
            )
            await self.db.commit()
            return result.scalar_one()
        else:
            # Create new budget
            db_budget = BudgetModel(
                category=budget_data.category,
                limit_amount=budget_data.limit,
                spent_amount=0.0,
            )
            self.db.add(db_budget)
            await self.db.commit()
            await self.db.refresh(db_budget)
            return db_budget

    async def update_spent_amount(
        self, category: str, spent_amount: float
    ) -> Optional[BudgetModel]:
        """Update spent amount for a budget."""
        result = await self.db.execute(
            update(BudgetModel)
            .where(BudgetModel.category == category)
            .values(spent_amount=spent_amount)
            .returning(BudgetModel)
        )
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete(self, category: str) -> bool:
        """Delete a budget."""
        result = await self.db.execute(
            delete(BudgetModel).where(BudgetModel.category == category)
        )
        await self.db.commit()
        return result.rowcount > 0


class InsightRepository:
    """Repository for AI insights database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[InsightModel]:
        """Get all insights."""
        result = await self.db.execute(select(InsightModel))
        return result.scalars().all()

    async def create(self, insight_data: AIInsight) -> InsightModel:
        """Create a new insight."""
        db_insight = InsightModel(
            title=insight_data.title,
            message=insight_data.message,
            type=insight_data.type,
            actionable=insight_data.actionable,
        )
        self.db.add(db_insight)
        await self.db.commit()
        await self.db.refresh(db_insight)
        return db_insight

    async def create_multiple(self, insights: List[AIInsight]) -> List[InsightModel]:
        """Create multiple insights."""
        db_insights = []
        for insight_data in insights:
            db_insight = InsightModel(
                title=insight_data.title,
                message=insight_data.message,
                type=insight_data.type,
                actionable=insight_data.actionable,
            )
            db_insights.append(db_insight)
            self.db.add(db_insight)

        await self.db.commit()
        for insight in db_insights:
            await self.db.refresh(insight)

        return db_insights

    async def delete_all(self) -> int:
        """Delete all insights (useful for regenerating fresh insights)."""
        result = await self.db.execute(delete(InsightModel))
        await self.db.commit()
        return result.rowcount


class UserRepository:
    """Repository for user database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[UserModel]:
        """Get user by email."""
        result = await self.db.execute(
            select(UserModel).where(UserModel.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[UserModel]:
        """Get user by username."""
        result = await self.db.execute(
            select(UserModel).where(UserModel.username == username)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> Optional[UserModel]:
        """Get user by ID."""
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, user_data: UserCreate) -> UserModel:
        """Create a new user."""
        hashed_password = get_password_hash(user_data.password)

        db_user = UserModel(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False,
        )

        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def update(self, user_id: int, user_data: UserUpdate) -> Optional[UserModel]:
        """Update a user."""
        update_data = user_data.dict(exclude_unset=True)

        # Hash password if provided
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(
                update_data.pop("password")
            )

        if not update_data:
            return await self.get_by_id(user_id)

        result = await self.db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(**update_data)
            .returning(UserModel)
        )
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete(self, user_id: int) -> bool:
        """Delete a user."""
        result = await self.db.execute(delete(UserModel).where(UserModel.id == user_id))
        await self.db.commit()
        return result.rowcount > 0

    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        user = await self.get_by_email(email)
        return user is not None

    async def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        user = await self.get_by_username(username)
        return user is not None


class UploadHistoryRepository:
    """Repository for upload history database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_by_user(self, user_id: int) -> List[UploadHistoryModel]:
        """Get all upload history for a user, ordered by upload date desc."""
        result = await self.db.execute(
            select(UploadHistoryModel)
            .where(UploadHistoryModel.user_id == user_id)
            .order_by(UploadHistoryModel.upload_date.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, upload_id: int) -> Optional[UploadHistoryModel]:
        """Get upload history by ID."""
        result = await self.db.execute(
            select(UploadHistoryModel).where(UploadHistoryModel.id == upload_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: int,
        filename: str,
        file_size: int,
        status: UploadStatus = UploadStatus.PROCESSING,
    ) -> UploadHistoryModel:
        """Create a new upload history record."""
        db_upload = UploadHistoryModel(
            user_id=user_id, filename=filename, file_size=file_size, status=status
        )
        self.db.add(db_upload)
        await self.db.commit()
        await self.db.refresh(db_upload)
        return db_upload

    async def update_status(
        self, upload_id: int, status: UploadStatus, error_message: Optional[str] = None
    ) -> Optional[UploadHistoryModel]:
        """Update upload status and optional error message."""
        result = await self.db.execute(
            update(UploadHistoryModel)
            .where(UploadHistoryModel.id == upload_id)
            .values(status=status, error_message=error_message)
        )

        if result.rowcount > 0:
            await self.db.commit()
            return await self.get_by_id(upload_id)
        return None

    async def delete(self, upload_id: int) -> bool:
        """Delete an upload history record."""
        result = await self.db.execute(
            delete(UploadHistoryModel).where(UploadHistoryModel.id == upload_id)
        )
        if result.rowcount > 0:
            await self.db.commit()
            return True
        return False


class IntegrationRepository:
    """Repository for integration database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: int) -> List[IntegrationModel]:
        """Get all integrations for a user."""
        result = await self.db.execute(
            select(IntegrationModel).where(IntegrationModel.user_id == user_id)
        )
        return result.scalars().all()

    async def get_by_id(self, integration_id: int) -> Optional[IntegrationModel]:
        """Get integration by ID."""
        result = await self.db.execute(
            select(IntegrationModel).where(IntegrationModel.id == integration_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_type(
        self, user_id: int, integration_type: IntegrationType
    ) -> Optional[IntegrationModel]:
        """Get integration by user and type (returns first one found)."""
        result = await self.db.execute(
            select(IntegrationModel).where(
                IntegrationModel.user_id == user_id,
                IntegrationModel.integration_type == integration_type,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_access_token(
        self, access_token: str
    ) -> Optional[IntegrationModel]:
        """Get integration by access token (link_id for Belvo)."""
        result = await self.db.execute(
            select(IntegrationModel).where(
                IntegrationModel.access_token == access_token
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_user_and_type(
        self, user_id: int, integration_type: IntegrationType
    ) -> List[IntegrationModel]:
        """Get all integrations by user and type."""
        result = await self.db.execute(
            select(IntegrationModel).where(
                IntegrationModel.user_id == user_id,
                IntegrationModel.integration_type == integration_type,
            )
        )
        return result.scalars().all()

    async def create(
        self, user_id: int, integration_data: IntegrationCreate
    ) -> IntegrationModel:
        """Create a new integration."""
        db_integration = IntegrationModel(
            user_id=user_id,
            integration_type=integration_data.integration_type,
            status=integration_data.status,
            account_id=integration_data.account_id,
            account_name=integration_data.account_name,
            institution_id=integration_data.institution_id,
            institution_name=integration_data.institution_name,
            access_token=integration_data.access_token,
            item_id=integration_data.item_id,
        )
        self.db.add(db_integration)
        await self.db.commit()
        await self.db.refresh(db_integration)
        return db_integration

    async def update(
        self, integration_id: int, update_data: IntegrationUpdate
    ) -> Optional[IntegrationModel]:
        """Update an integration."""
        update_dict = update_data.model_dump(exclude_unset=True)

        # Remove metadata from update_dict as it's not stored in database
        if 'metadata' in update_dict:
            update_dict.pop('metadata')

        if not update_dict:
            return await self.get_by_id(integration_id)

        result = await self.db.execute(
            update(IntegrationModel)
            .where(IntegrationModel.id == integration_id)
            .values(**update_dict)
            .returning(IntegrationModel)
        )
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete(self, integration_id: int) -> bool:
        """Delete an integration."""
        result = await self.db.execute(
            delete(IntegrationModel).where(IntegrationModel.id == integration_id)
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_active_integrations(self, user_id: int) -> List[IntegrationModel]:
        """Get all active/connected integrations for a user."""
        result = await self.db.execute(
            select(IntegrationModel).where(
                IntegrationModel.user_id == user_id,
                IntegrationModel.status == IntegrationStatus.CONNECTED,
            )
        )
        return result.scalars().all()

    async def get_all(self) -> List[IntegrationModel]:
        """Get all integrations (for debugging purposes)."""
        result = await self.db.execute(select(IntegrationModel))
        return result.scalars().all()


class BelvoInstitutionRepository:
    """Repository for managing Belvo institutions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_belvo_id(self, belvo_id: int) -> Optional[BelvoInstitutionModel]:
        """Get institution by Belvo ID."""
        result = await self.db.execute(
            select(BelvoInstitutionModel).where(
                BelvoInstitutionModel.belvo_id == belvo_id
            )
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[BelvoInstitutionModel]:
        """Get institution by code."""
        result = await self.db.execute(
            select(BelvoInstitutionModel).where(BelvoInstitutionModel.code == code)
        )
        return result.scalar_one_or_none()

    async def get_by_country(self, country_code: str) -> List[BelvoInstitutionModel]:
        """Get all institutions for a specific country."""
        result = await self.db.execute(
            select(BelvoInstitutionModel)
            .where(BelvoInstitutionModel.country_code == country_code)
            .order_by(BelvoInstitutionModel.display_name)
        )
        return result.scalars().all()

    async def get_all(self) -> List[BelvoInstitutionModel]:
        """Get all institutions."""
        result = await self.db.execute(
            select(BelvoInstitutionModel).order_by(BelvoInstitutionModel.display_name)
        )
        return result.scalars().all()

    async def create(
        self, institution_data: BelvoInstitutionCreate
    ) -> BelvoInstitutionModel:
        """Create a new institution."""
        db_institution = BelvoInstitutionModel(
            belvo_id=institution_data.belvo_id,
            name=institution_data.name,
            display_name=institution_data.display_name,
            code=institution_data.code,
            type=institution_data.type,
            status=institution_data.status,
            country_code=institution_data.country_code,
            country_codes=institution_data.country_codes,
            primary_color=institution_data.primary_color,
            logo=institution_data.logo,
            icon_logo=institution_data.icon_logo,
            text_logo=institution_data.text_logo,
            website=institution_data.website,
        )
        self.db.add(db_institution)
        await self.db.commit()
        await self.db.refresh(db_institution)
        return db_institution

    async def update(
        self, belvo_id: int, update_data: BelvoInstitutionUpdate
    ) -> Optional[BelvoInstitutionModel]:
        """Update an institution."""
        update_dict = update_data.model_dump(exclude_unset=True)

        if not update_dict:
            return await self.get_by_belvo_id(belvo_id)

        result = await self.db.execute(
            update(BelvoInstitutionModel)
            .where(BelvoInstitutionModel.belvo_id == belvo_id)
            .values(**update_dict)
            .returning(BelvoInstitutionModel)
        )
        await self.db.commit()
        return result.scalar_one_or_none()

    async def count(self) -> int:
        """Get total count of institutions."""
        result = await self.db.execute(select(func.count(BelvoInstitutionModel.id)))
        return result.scalar()

    async def get_existing_belvo_ids(self) -> List[int]:
        """Get list of all existing Belvo IDs to avoid duplicates."""
        result = await self.db.execute(select(BelvoInstitutionModel.belvo_id))
        return [row[0] for row in result.fetchall()]
