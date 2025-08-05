"""
Basic integration tests for budgets/goals module.

Simple tests to verify core budgets and goals functionality works correctly
without complex mocking or advanced scenarios.
"""

import pytest
from datetime import datetime, date

from src.budgets.models import GoalModel, BudgetModel
from src.budgets.schemas import GoalCreate, GoalUpdate
from src.shared.constants import GoalType, TimeHorizon, GoalRecurrence, GoalStatus


@pytest.mark.unit
@pytest.mark.budgets
class TestBasicBudgetsGoals:
    """Basic budgets and goals functionality tests."""

    @pytest.mark.asyncio
    async def test_goal_model_creation(self, db_session):
        """Test creating goal models directly."""
        # Test spending goal (budget)
        spending_goal = GoalModel(
            title="Groceries Budget",
            description="Monthly grocery spending limit",
            goal_type=GoalType.SPENDING.value,
            time_horizon=TimeHorizon.SHORT.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            target_amount=400.00,
            current_amount=150.50,
            category="GROCERIES",
            priority=1,
            auto_calculate=True,
            color="#4CAF50",
            icon="shopping-cart",
        )
        
        db_session.add(spending_goal)
        await db_session.commit()
        await db_session.refresh(spending_goal)
        
        assert spending_goal.id is not None
        assert spending_goal.title == "Groceries Budget"
        assert spending_goal.goal_type == GoalType.SPENDING.value
        assert spending_goal.target_amount == 400.00
        assert spending_goal.current_amount == 150.50
        assert spending_goal.category == "GROCERIES"
        assert spending_goal.created_at is not None

    @pytest.mark.asyncio
    async def test_savings_goal_creation(self, db_session):
        """Test creating a savings goal."""
        savings_goal = GoalModel(
            title="Emergency Fund",
            description="Build emergency fund for 6 months expenses",
            goal_type=GoalType.SAVING.value,
            time_horizon=TimeHorizon.LONG.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            target_amount=5000.00,
            current_amount=1200.00,
            contribution_amount=300.00,
            target_date=date(2024, 12, 31),
            priority=1,
            auto_calculate=False,
            color="#2196F3",
            icon="piggy-bank",
        )
        
        db_session.add(savings_goal)
        await db_session.commit()
        await db_session.refresh(savings_goal)
        
        assert savings_goal.id is not None
        assert savings_goal.title == "Emergency Fund"
        assert savings_goal.goal_type == GoalType.SAVING.value
        assert savings_goal.target_amount == 5000.00
        assert savings_goal.current_amount == 1200.00
        assert savings_goal.contribution_amount == 300.00
        assert savings_goal.target_date is not None

    @pytest.mark.asyncio
    async def test_debt_goal_creation(self, db_session):
        """Test creating a debt payoff goal."""
        debt_goal = GoalModel(
            title="Credit Card Payoff",
            description="Pay off high-interest credit card debt",
            goal_type=GoalType.DEBT.value,
            time_horizon=TimeHorizon.MEDIUM.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            target_amount=2500.00,
            current_amount=800.00,
            contribution_amount=400.00,
            target_date=date(2024, 8, 31),
            priority=1,
            auto_calculate=False,
            color="#F44336",
            icon="credit-card",
        )
        
        db_session.add(debt_goal)
        await db_session.commit()
        await db_session.refresh(debt_goal)
        
        assert debt_goal.id is not None
        assert debt_goal.title == "Credit Card Payoff"
        assert debt_goal.goal_type == GoalType.DEBT.value
        assert debt_goal.target_amount == 2500.00
        assert debt_goal.current_amount == 800.00

    @pytest.mark.asyncio
    async def test_legacy_budget_model(self, db_session):
        """Test legacy budget model for backward compatibility."""
        legacy_budget = BudgetModel(
            category="ENTERTAINMENT",
            limit_amount=200.00,
            spent_amount=75.50,
        )
        
        db_session.add(legacy_budget)
        await db_session.commit()
        await db_session.refresh(legacy_budget)
        
        assert legacy_budget.id is not None
        assert legacy_budget.category == "ENTERTAINMENT"
        assert legacy_budget.limit_amount == 200.00
        assert legacy_budget.spent_amount == 75.50
        assert legacy_budget.created_at is not None

    def test_goal_schema_validation(self):
        """Test goal schema validation."""
        # Test valid spending goal
        spending_goal = GoalCreate(
            title="Monthly Food Budget",
            description="Limit monthly food expenses",
            goal_type=GoalType.SPENDING,
            time_horizon=TimeHorizon.SHORT,
            recurrence=GoalRecurrence.MONTHLY,
            target_amount=300.00,
            category="FOOD",
            priority=1,
        )
        
        assert spending_goal.title == "Monthly Food Budget"
        assert spending_goal.goal_type == GoalType.SPENDING
        assert spending_goal.target_amount == 300.00
        assert spending_goal.category == "FOOD"

    def test_goal_schema_spending_validation(self):
        """Test that spending goals require a category."""
        with pytest.raises(ValueError, match="Spending goals must have a category"):
            GoalCreate(
                title="Invalid Spending Goal",
                goal_type=GoalType.SPENDING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=300.00,
                # Missing category for spending goal
            )

    def test_goal_schema_savings_validation(self):
        """Test that savings goals should have target dates."""
        with pytest.raises(ValueError, match="Savings and debt goals should have a target date"):
            GoalCreate(
                title="Invalid Savings Goal",
                goal_type=GoalType.SAVING,
                time_horizon=TimeHorizon.LONG,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=5000.00,
                # Missing target_date for savings goal
            )

    def test_goal_update_schema(self):
        """Test goal update schema."""
        update_data = GoalUpdate(
            title="Updated Budget Title",
            target_amount=350.00,
            current_amount=120.00,
            priority=2,
            status=GoalStatus.PAUSED,
        )
        
        assert update_data.title == "Updated Budget Title"
        assert update_data.target_amount == 350.00
        assert update_data.current_amount == 120.00
        assert update_data.priority == 2
        assert update_data.status == GoalStatus.PAUSED

    def test_goal_enums_values(self):
        """Test goal enum values."""
        # Test GoalType enum
        assert GoalType.SPENDING.value == "spending"
        assert GoalType.SAVING.value == "saving"
        assert GoalType.DEBT.value == "debt"
        
        # Test TimeHorizon enum
        assert TimeHorizon.SHORT.value == "short"
        assert TimeHorizon.MEDIUM.value == "medium"
        assert TimeHorizon.LONG.value == "long"
        
        # Test GoalRecurrence enum
        assert GoalRecurrence.ONE_TIME.value == "one_time"
        assert GoalRecurrence.WEEKLY.value == "weekly"
        assert GoalRecurrence.MONTHLY.value == "monthly"
        assert GoalRecurrence.YEARLY.value == "yearly"
        
        # Test GoalStatus enum
        assert GoalStatus.ACTIVE.value == "active"
        assert GoalStatus.COMPLETED.value == "completed"
        assert GoalStatus.PAUSED.value == "paused"
        assert GoalStatus.CANCELLED.value == "cancelled"

    def test_goal_model_repr(self):
        """Test GoalModel string representation."""
        goal = GoalModel(
            id=1,
            title="Test Goal",
            goal_type=GoalType.SPENDING.value,
            time_horizon=TimeHorizon.SHORT.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            target_amount=500.00,
        )
        
        repr_str = repr(goal)
        
        assert "id=1" in repr_str
        assert "title='Test Goal'" in repr_str
        assert "type='spending'" in repr_str
        assert "target=500.0" in repr_str

    def test_budget_model_repr(self):
        """Test BudgetModel string representation."""
        budget = BudgetModel(
            id=1,
            category="TRANSPORT",
            limit_amount=150.00,
        )
        
        repr_str = repr(budget)
        
        assert "id=1" in repr_str
        assert "category='TRANSPORT'" in repr_str
        assert "limit=150.0" in repr_str

    @pytest.mark.asyncio
    async def test_goal_query_operations(self, db_session):
        """Test basic query operations on goals."""
        # Create multiple goals
        goals = [
            GoalModel(
                title="Budget 1",
                goal_type=GoalType.SPENDING.value,
                time_horizon=TimeHorizon.SHORT.value,
                recurrence=GoalRecurrence.MONTHLY.value,
                target_amount=300.00,
                category="GROCERIES",
                priority=1,
            ),
            GoalModel(
                title="Savings 1",
                goal_type=GoalType.SAVING.value,
                time_horizon=TimeHorizon.LONG.value,
                recurrence=GoalRecurrence.MONTHLY.value,
                target_amount=10000.00,
                priority=2,
            ),
            GoalModel(
                title="Debt 1",
                goal_type=GoalType.DEBT.value,
                time_horizon=TimeHorizon.MEDIUM.value,
                recurrence=GoalRecurrence.MONTHLY.value,
                target_amount=5000.00,
                priority=1,
            ),
        ]
        
        for goal in goals:
            db_session.add(goal)
        
        await db_session.commit()
        
        # Refresh to get IDs
        for goal in goals:
            await db_session.refresh(goal)
        
        # Verify all goals were created
        assert all(goal.id is not None for goal in goals)
        assert len(goals) == 3

    @pytest.mark.asyncio
    async def test_update_goal_progress(self, db_session):
        """Test updating goal progress."""
        goal = GoalModel(
            title="Emergency Fund",
            goal_type=GoalType.SAVING.value,
            time_horizon=TimeHorizon.LONG.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            target_amount=5000.00,
            current_amount=1000.00,
            priority=1,
        )
        
        db_session.add(goal)
        await db_session.commit()
        await db_session.refresh(goal)
        
        # Update progress
        goal.current_amount = 1500.00
        await db_session.commit()
        
        assert goal.current_amount == 1500.00

    def test_goal_priority_validation(self):
        """Test goal priority validation."""
        # Test valid priorities
        for priority in [1, 2, 3]:
            goal = GoalCreate(
                title="Test Goal",
                goal_type=GoalType.SAVING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=1000.00,
                target_date=date(2024, 12, 31),
                priority=priority,
            )
            assert goal.priority == priority

    def test_goal_amount_validation(self):
        """Test goal amount validation."""
        # Target amount must be positive
        with pytest.raises(ValueError):
            GoalCreate(
                title="Invalid Goal",
                goal_type=GoalType.SAVING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=-100.00,  # Invalid negative amount
                target_date=date(2024, 12, 31),
            )