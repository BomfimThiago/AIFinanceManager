"""
Unit tests for the budgets/goals repository module.

Tests the GoalsRepository class methods for database operations
including goal creation, retrieval, filtering, and updates.
"""

import pytest
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from src.budgets.models import GoalModel
from src.budgets.goals_repository import GoalsRepository
from src.budgets.schemas import GoalCreate, GoalUpdate
from src.shared.constants import GoalType, TimeHorizon, GoalRecurrence, GoalStatus


@pytest.mark.unit
@pytest.mark.budgets
class TestGoalsRepository:
    """Test cases for GoalsRepository."""

    @pytest.fixture
    def goals_repository(self, db_session: AsyncSession) -> GoalsRepository:
        """Create a GoalsRepository instance for testing."""
        return GoalsRepository(db_session)

    @pytest.fixture
    def sample_spending_goal_create(self) -> GoalCreate:
        """Create sample spending goal creation data."""
        return GoalCreate(
            title="Groceries Budget",
            description="Monthly grocery spending limit",
            goal_type=GoalType.SPENDING,
            time_horizon=TimeHorizon.SHORT,
            recurrence=GoalRecurrence.MONTHLY,
            target_amount=400.00,
            category="GROCERIES",
            priority=1,
            auto_calculate=True,
            color="#4CAF50",
            icon="shopping-cart",
        )

    @pytest.fixture
    def sample_savings_goal_create(self) -> GoalCreate:
        """Create sample savings goal creation data."""
        return GoalCreate(
            title="Emergency Fund",
            description="Build emergency fund for 6 months expenses",
            goal_type=GoalType.SAVING,
            time_horizon=TimeHorizon.LONG,
            recurrence=GoalRecurrence.MONTHLY,
            target_amount=5000.00,
            contribution_amount=300.00,
            target_date="2024-12-31",
            priority=1,
            auto_calculate=False,
            color="#2196F3",
            icon="piggy-bank",
        )

    @pytest.fixture
    def sample_debt_goal_create(self) -> GoalCreate:
        """Create sample debt goal creation data."""
        return GoalCreate(
            title="Credit Card Payoff",
            description="Pay off high-interest credit card debt",
            goal_type=GoalType.DEBT,
            time_horizon=TimeHorizon.MEDIUM,
            recurrence=GoalRecurrence.MONTHLY,
            target_amount=2500.00,
            contribution_amount=400.00,
            target_date="2024-08-31",
            priority=1,
            auto_calculate=False,
            color="#F44336",
            icon="credit-card",
        )

    @pytest.mark.asyncio
    async def test_create_spending_goal(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test creating a new spending goal."""
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        assert created_goal.id is not None
        assert created_goal.title == sample_spending_goal_create.title
        assert created_goal.goal_type == GoalType.SPENDING.value
        assert created_goal.target_amount == sample_spending_goal_create.target_amount
        assert created_goal.category == sample_spending_goal_create.category
        assert created_goal.time_horizon == TimeHorizon.SHORT.value
        assert created_goal.recurrence == GoalRecurrence.MONTHLY.value
        assert created_goal.priority == 1
        assert created_goal.auto_calculate is True
        assert created_goal.color == "#4CAF50"
        assert created_goal.icon == "shopping-cart"
        assert created_goal.status == GoalStatus.ACTIVE.value  # Default
        assert created_goal.current_amount == 0.0  # Default
        assert created_goal.created_at is not None

    @pytest.mark.asyncio
    async def test_create_savings_goal(
        self, goals_repository: GoalsRepository, sample_savings_goal_create: GoalCreate
    ):
        """Test creating a new savings goal."""
        goal_data = sample_savings_goal_create.model_dump()
        if "target_date" in goal_data and goal_data["target_date"]:
            goal_data["target_date"] = datetime.strptime(goal_data["target_date"], "%Y-%m-%d").date()
        created_goal = await goals_repository.create(goal_data)
        
        assert created_goal.id is not None
        assert created_goal.title == sample_savings_goal_create.title
        assert created_goal.goal_type == GoalType.SAVING.value
        assert created_goal.target_amount == 5000.00
        assert created_goal.contribution_amount == 300.00
        assert created_goal.target_date is not None
        assert created_goal.category is None  # Savings goals don't have categories
        assert created_goal.auto_calculate is False

    @pytest.mark.asyncio
    async def test_create_debt_goal(
        self, goals_repository: GoalsRepository, sample_debt_goal_create: GoalCreate
    ):
        """Test creating a new debt goal."""
        goal_data = sample_debt_goal_create.model_dump()
        if "target_date" in goal_data and goal_data["target_date"]:
            goal_data["target_date"] = datetime.strptime(goal_data["target_date"], "%Y-%m-%d").date()
        created_goal = await goals_repository.create(goal_data)
        
        assert created_goal.id is not None
        assert created_goal.title == sample_debt_goal_create.title
        assert created_goal.goal_type == GoalType.DEBT.value
        assert created_goal.target_amount == 2500.00
        assert created_goal.contribution_amount == 400.00
        assert created_goal.time_horizon == TimeHorizon.MEDIUM.value

    @pytest.mark.asyncio
    async def test_get_by_id(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test retrieving goal by ID."""
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        retrieved_goal = await goals_repository.get_by_id(created_goal.id)
        
        assert retrieved_goal is not None
        assert retrieved_goal.id == created_goal.id
        assert retrieved_goal.title == created_goal.title

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, goals_repository: GoalsRepository):
        """Test retrieving goal by non-existent ID."""
        goal = await goals_repository.get_by_id(99999)
        
        assert goal is None

    @pytest.mark.asyncio
    async def test_update_goal(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test updating goal information."""
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        update_data = GoalUpdate(
            title="Updated Groceries Budget",
            target_amount=450.00,
            current_amount=200.00,
            priority=2,
            status=GoalStatus.PAUSED,
        )
        
        updated_goal = await goals_repository.update(created_goal.id, update_data)
        
        assert updated_goal is not None
        assert updated_goal.title == "Updated Groceries Budget"
        assert updated_goal.target_amount == 450.00
        assert updated_goal.current_amount == 200.00
        assert updated_goal.priority == 2
        assert updated_goal.status == GoalStatus.PAUSED.value
        assert updated_goal.description == created_goal.description  # Unchanged

    @pytest.mark.asyncio
    async def test_update_goal_not_found(self, goals_repository: GoalsRepository):
        """Test updating non-existent goal."""
        update_data = GoalUpdate(target_amount=500.00)
        
        updated_goal = await goals_repository.update(99999, update_data)
        
        assert updated_goal is None

    @pytest.mark.asyncio
    async def test_delete_goal(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test deleting a goal."""
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        success = await goals_repository.delete(created_goal.id)
        
        assert success is True
        
        # Verify goal is deleted
        deleted_goal = await goals_repository.get_by_id(created_goal.id)
        assert deleted_goal is None

    @pytest.mark.asyncio
    async def test_delete_goal_not_found(self, goals_repository: GoalsRepository):
        """Test deleting non-existent goal."""
        success = await goals_repository.delete(99999)
        
        assert success is False

    @pytest.mark.asyncio
    async def test_list_goals(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test listing goals with pagination."""
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        goals, _ = await goals_repository.get_multi(skip=0, limit=10)
        
        assert len(goals) >= 1
        assert any(goal.id == created_goal.id for goal in goals)

    @pytest.mark.asyncio
    async def test_count_goals(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test counting total goals."""
        await goals_repository.create(sample_spending_goal_create.model_dump())
        
        count = await goals_repository.count()
        
        assert count >= 1

    @pytest.mark.asyncio
    async def test_get_by_type(
        self, goals_repository: GoalsRepository, 
        sample_spending_goal_create: GoalCreate,
        sample_savings_goal_create: GoalCreate
    ):
        """Test filtering goals by type."""
        await goals_repository.create(sample_spending_goal_create.model_dump())
        savings_goal_data = sample_savings_goal_create.model_dump()
        if "target_date" in savings_goal_data and savings_goal_data["target_date"]:
            savings_goal_data["target_date"] = datetime.strptime(savings_goal_data["target_date"], "%Y-%m-%d").date()
        await goals_repository.create(savings_goal_data)
        
        spending_goals = await goals_repository.get_by_type(GoalType.SPENDING)
        assert len(spending_goals) >= 1
        assert all(goal.goal_type == GoalType.SPENDING.value for goal in spending_goals)
        
        savings_goals = await goals_repository.get_by_type(GoalType.SAVING)
        assert len(savings_goals) >= 1
        assert all(goal.goal_type == GoalType.SAVING.value for goal in savings_goals)

    @pytest.mark.asyncio
    async def test_get_active_goals(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test getting active goals only."""
        # Create active goal
        active_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        # Create paused goal
        paused_goal_data = sample_spending_goal_create.model_dump()
        paused_goal_data["title"] = "Paused Goal"
        paused_goal_data["category"] = "TRANSPORT"
        paused_goal = await goals_repository.create(paused_goal_data)
        
        # Update one goal to paused status
        await goals_repository.update(paused_goal.id, GoalUpdate(status=GoalStatus.PAUSED))
        
        active_goals = await goals_repository.get_active_goals()
        assert len(active_goals) >= 1
        assert all(goal.status == GoalStatus.ACTIVE.value for goal in active_goals)
        assert any(goal.id == active_goal.id for goal in active_goals)

    @pytest.mark.asyncio
    async def test_get_spending_goals(
        self, goals_repository: GoalsRepository, 
        sample_spending_goal_create: GoalCreate,
        sample_savings_goal_create: GoalCreate
    ):
        """Test getting spending goals only."""
        await goals_repository.create(sample_spending_goal_create.model_dump())
        savings_goal_data = sample_savings_goal_create.model_dump()
        if "target_date" in savings_goal_data and savings_goal_data["target_date"]:
            savings_goal_data["target_date"] = datetime.strptime(savings_goal_data["target_date"], "%Y-%m-%d").date()
        await goals_repository.create(savings_goal_data)
        
        spending_goals = await goals_repository.get_spending_goals()
        assert len(spending_goals) >= 1
        assert all(goal.goal_type == GoalType.SPENDING.value for goal in spending_goals)
        assert all(goal.status == GoalStatus.ACTIVE.value for goal in spending_goals)

    @pytest.mark.asyncio
    async def test_get_by_category(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test getting spending goal by category."""
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        retrieved_goal = await goals_repository.get_by_category("GROCERIES")
        
        assert retrieved_goal is not None
        assert retrieved_goal.id == created_goal.id
        assert retrieved_goal.category == "GROCERIES"
        assert retrieved_goal.goal_type == GoalType.SPENDING.value

    @pytest.mark.asyncio
    async def test_get_by_category_not_found(self, goals_repository: GoalsRepository):
        """Test getting spending goal by non-existent category."""
        goal = await goals_repository.get_by_category("NONEXISTENT")
        
        assert goal is None

    @pytest.mark.asyncio
    async def test_get_goals_by_priority(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test filtering goals by priority."""
        # Create high priority goal
        high_priority_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        # Create medium priority goal
        medium_priority_data = sample_spending_goal_create.model_dump()
        medium_priority_data["title"] = "Medium Priority Goal"
        medium_priority_data["category"] = "ENTERTAINMENT"
        medium_priority_data["priority"] = 2
        await goals_repository.create(medium_priority_data)
        
        high_priority_goals = await goals_repository.get_goals_by_priority(1)
        assert len(high_priority_goals) >= 1
        assert all(goal.priority == 1 for goal in high_priority_goals)
        assert any(goal.id == high_priority_goal.id for goal in high_priority_goals)
        
        medium_priority_goals = await goals_repository.get_goals_by_priority(2)
        assert len(medium_priority_goals) >= 1
        assert all(goal.priority == 2 for goal in medium_priority_goals)

    @pytest.mark.asyncio
    async def test_get_goals_by_time_horizon(
        self, goals_repository: GoalsRepository, 
        sample_spending_goal_create: GoalCreate,
        sample_savings_goal_create: GoalCreate
    ):
        """Test filtering goals by time horizon."""
        await goals_repository.create(sample_spending_goal_create.model_dump())  # SHORT
        savings_goal_data = sample_savings_goal_create.model_dump()   # LONG
        if "target_date" in savings_goal_data and savings_goal_data["target_date"]:
            savings_goal_data["target_date"] = datetime.strptime(savings_goal_data["target_date"], "%Y-%m-%d").date()
        await goals_repository.create(savings_goal_data)
        
        short_term_goals = await goals_repository.get_goals_by_time_horizon(TimeHorizon.SHORT)
        assert len(short_term_goals) >= 1
        assert all(goal.time_horizon == TimeHorizon.SHORT.value for goal in short_term_goals)
        
        long_term_goals = await goals_repository.get_goals_by_time_horizon(TimeHorizon.LONG)
        assert len(long_term_goals) >= 1
        assert all(goal.time_horizon == TimeHorizon.LONG.value for goal in long_term_goals)

    @pytest.mark.asyncio
    async def test_get_goals_due_soon(
        self, goals_repository: GoalsRepository, sample_savings_goal_create: GoalCreate
    ):
        """Test getting goals due soon."""
        # Create goal due in 15 days
        soon_due_data = sample_savings_goal_create.model_dump()
        soon_due_data["target_date"] = (date.today() + timedelta(days=15)).isoformat()
        # Convert string date to date object for database
        if "target_date" in soon_due_data and soon_due_data["target_date"]:
            soon_due_data["target_date"] = datetime.strptime(soon_due_data["target_date"], "%Y-%m-%d").date()
        soon_due_goal = await goals_repository.create(soon_due_data)
        
        # Create goal due in 60 days
        later_due_data = sample_savings_goal_create.model_dump()
        later_due_data["title"] = "Later Due Goal"
        later_due_data["target_date"] = (date.today() + timedelta(days=60)).isoformat()
        # Convert string date to date object for database
        if "target_date" in later_due_data and later_due_data["target_date"]:
            later_due_data["target_date"] = datetime.strptime(later_due_data["target_date"], "%Y-%m-%d").date()
        await goals_repository.create(later_due_data)
        
        # Get goals due within 30 days
        due_soon = await goals_repository.get_goals_due_soon(30)
        assert len(due_soon) >= 1
        assert any(goal.id == soon_due_goal.id for goal in due_soon)
        
        # Get goals due within 90 days
        due_later = await goals_repository.get_goals_due_soon(90)
        assert len(due_later) >= 2

    @pytest.mark.asyncio
    async def test_get_completed_goals(
        self, goals_repository: GoalsRepository, sample_spending_goal_create: GoalCreate
    ):
        """Test getting completed goals."""
        # Create and complete a goal
        created_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        await goals_repository.update(created_goal.id, GoalUpdate(status=GoalStatus.COMPLETED))
        
        completed_goals = await goals_repository.get_completed_goals(limit=5)
        assert len(completed_goals) >= 1
        assert all(goal.status == GoalStatus.COMPLETED.value for goal in completed_goals)
        assert any(goal.id == created_goal.id for goal in completed_goals)

    @pytest.mark.asyncio
    async def test_update_goal_progress(
        self, goals_repository: GoalsRepository, sample_savings_goal_create: GoalCreate
    ):
        """Test updating goal progress."""
        goal_data = sample_savings_goal_create.model_dump()
        if "target_date" in goal_data and goal_data["target_date"]:
            goal_data["target_date"] = datetime.strptime(goal_data["target_date"], "%Y-%m-%d").date()
        created_goal = await goals_repository.create(goal_data)
        
        # Update progress
        progress_update = GoalUpdate(current_amount=1500.00)
        updated_goal = await goals_repository.update(created_goal.id, progress_update)
        
        assert updated_goal is not None
        assert updated_goal.current_amount == 1500.00
        assert updated_goal.target_amount == created_goal.target_amount  # Unchanged

    @pytest.mark.asyncio
    async def test_goal_filtering_combinations(
        self, goals_repository: GoalsRepository, 
        sample_spending_goal_create: GoalCreate,
        sample_savings_goal_create: GoalCreate,
        sample_debt_goal_create: GoalCreate
    ):
        """Test various goal filtering combinations."""
        spending_goal = await goals_repository.create(sample_spending_goal_create.model_dump())
        
        savings_goal_data = sample_savings_goal_create.model_dump()
        if "target_date" in savings_goal_data and savings_goal_data["target_date"]:
            savings_goal_data["target_date"] = datetime.strptime(savings_goal_data["target_date"], "%Y-%m-%d").date()
        savings_goal = await goals_repository.create(savings_goal_data)
        
        debt_goal_data = sample_debt_goal_create.model_dump()
        if "target_date" in debt_goal_data and debt_goal_data["target_date"]:
            debt_goal_data["target_date"] = datetime.strptime(debt_goal_data["target_date"], "%Y-%m-%d").date()
        debt_goal = await goals_repository.create(debt_goal_data)
        
        # Test type filtering
        spending_goals = await goals_repository.get_by_type(GoalType.SPENDING)
        savings_goals = await goals_repository.get_by_type(GoalType.SAVING)
        debt_goals = await goals_repository.get_by_type(GoalType.DEBT)
        
        assert len(spending_goals) >= 1
        assert len(savings_goals) >= 1
        assert len(debt_goals) >= 1
        
        # Test active goals (all should be active by default)
        active_goals = await goals_repository.get_active_goals()
        assert len(active_goals) >= 3
        
        # Test priority filtering (all created with priority 1)
        high_priority_goals = await goals_repository.get_goals_by_priority(1)
        assert len(high_priority_goals) >= 3

    def test_goal_model_repr(self, sample_spending_goal_create: GoalCreate):
        """Test GoalModel string representation."""
        goal = GoalModel(
            id=1,
            title=sample_spending_goal_create.title,
            goal_type=sample_spending_goal_create.goal_type.value,
            target_amount=sample_spending_goal_create.target_amount,
            time_horizon=sample_spending_goal_create.time_horizon.value,
            recurrence=sample_spending_goal_create.recurrence.value,
        )
        
        repr_str = repr(goal)
        
        assert "id=1" in repr_str
        assert f"title='{sample_spending_goal_create.title}'" in repr_str
        assert f"type='{sample_spending_goal_create.goal_type.value}'" in repr_str
        assert f"target={sample_spending_goal_create.target_amount}" in repr_str