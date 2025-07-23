from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from sqlalchemy.orm import selectinload

from .models import ExpenseModel, BudgetModel, InsightModel, UserModel, ExpenseType, ExpenseSource
from ..models.expense import Expense, ExpenseCreate, Budget, BudgetCreate, AIInsight
from ..models.auth import User, UserCreate, UserUpdate
from ..core.auth import get_password_hash


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
            source=ExpenseSource(expense_data.source) if expense_data.source else ExpenseSource.MANUAL,
            items=expense_data.items
        )
        self.db.add(db_expense)
        await self.db.commit()
        await self.db.refresh(db_expense)
        return db_expense

    async def update(self, expense_id: int, expense_data: ExpenseCreate) -> Optional[ExpenseModel]:
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
                source=ExpenseSource(expense_data.source) if expense_data.source else ExpenseSource.MANUAL,
                items=expense_data.items
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
                spent_amount=0.0
            )
            self.db.add(db_budget)
            await self.db.commit()
            await self.db.refresh(db_budget)
            return db_budget

    async def update_spent_amount(self, category: str, spent_amount: float) -> Optional[BudgetModel]:
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
            actionable=insight_data.actionable
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
                actionable=insight_data.actionable
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
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
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
            is_verified=False
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
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
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
        result = await self.db.execute(
            delete(UserModel).where(UserModel.id == user_id)
        )
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