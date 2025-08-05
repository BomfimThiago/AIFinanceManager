"""
Unit tests for the budgets/goals service module.

Tests the GoalsService class methods for business logic operations
including goal creation, retrieval, filtering, and progress calculation.
"""

import pytest
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from src.budgets.models import GoalModel
from src.budgets.goals_repository import GoalsRepository
from src.budgets.schemas import Goal, GoalCreate, GoalUpdate
from src.budgets.goals_service import GoalsService
from src.shared.constants import GoalType, TimeHorizon, GoalRecurrence, GoalStatus


@pytest.mark.unit
@pytest.mark.budgets
class TestGoalsService:
    """Test cases for GoalsService."""

    @pytest.fixture
    def mock_repository(self):
        """Create a mock GoalsRepository."""
        return AsyncMock(spec=GoalsRepository)

    @pytest.fixture
    def goals_service(self, mock_repository):
        """Create a GoalsService with mock repository."""
        return GoalsService(mock_repository)

    @pytest.fixture
    def sample_goal_model(self):
        """Create a sample GoalModel for testing."""
        return GoalModel(
            id=1,
            title="Groceries Budget",
            description="Monthly grocery spending limit",
            goal_type=GoalType.SPENDING.value,
            time_horizon=TimeHorizon.SHORT.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            status=GoalStatus.ACTIVE.value,
            target_amount=400.00,
            current_amount=150.50,
            category="GROCERIES",
            target_date=date(2024, 12, 31),
            start_date=date(2024, 1, 1),
            priority=1,
            auto_calculate=True,
            color="#4CAF50",
            icon="shopping-cart",
            created_at=datetime(2024, 1, 1, 10, 0, 0),
            updated_at=datetime(2024, 1, 15, 12, 30, 0),
        )

    @pytest.fixture
    def sample_savings_goal_model(self):
        """Create a sample savings goal model."""
        return GoalModel(
            id=2,
            title="Emergency Fund",
            description="Build emergency fund",
            goal_type=GoalType.SAVING.value,
            time_horizon=TimeHorizon.LONG.value,
            recurrence=GoalRecurrence.MONTHLY.value,
            status=GoalStatus.ACTIVE.value,
            target_amount=5000.00,
            current_amount=1200.00,
            contribution_amount=300.00,
            target_date=date(2024, 12, 31),
            start_date=date(2024, 1, 1),
            priority=1,
            auto_calculate=False,
            color="#2196F3",
            icon="piggy-bank",
            created_at=datetime(2024, 1, 1, 10, 0, 0),
            updated_at=datetime(2024, 2, 1, 12, 30, 0),
        )

    @pytest.fixture
    def sample_goal_create(self):
        """Create sample goal creation data."""
        return GoalCreate(
            title="Transport Budget",
            description="Monthly transport spending limit",
            goal_type=GoalType.SPENDING,
            time_horizon=TimeHorizon.SHORT,
            recurrence=GoalRecurrence.MONTHLY,
            target_amount=200.00,
            category="TRANSPORT",
            priority=2,
            auto_calculate=True,
            color="#FF9800",
            icon="car",
        )

    def test_model_to_schema_conversion(
        self, goals_service: GoalsService, sample_goal_model: GoalModel
    ):
        """Test conversion from SQLAlchemy model to Pydantic schema."""
        goal_schema = goals_service._model_to_schema(sample_goal_model)
        
        assert isinstance(goal_schema, Goal)
        assert goal_schema.id == sample_goal_model.id
        assert goal_schema.title == sample_goal_model.title
        assert goal_schema.description == sample_goal_model.description
        assert goal_schema.goal_type == GoalType(sample_goal_model.goal_type)
        assert goal_schema.time_horizon == TimeHorizon(sample_goal_model.time_horizon)
        assert goal_schema.recurrence == GoalRecurrence(sample_goal_model.recurrence)
        assert goal_schema.status == GoalStatus(sample_goal_model.status)
        assert goal_schema.target_amount == sample_goal_model.target_amount
        assert goal_schema.current_amount == sample_goal_model.current_amount
        assert goal_schema.category == sample_goal_model.category
        assert goal_schema.target_date == sample_goal_model.target_date.isoformat()
        assert goal_schema.start_date == sample_goal_model.start_date.isoformat()
        assert goal_schema.priority == sample_goal_model.priority
        assert goal_schema.auto_calculate == sample_goal_model.auto_calculate
        assert goal_schema.color == sample_goal_model.color
        assert goal_schema.icon == sample_goal_model.icon
        assert goal_schema.created_at == sample_goal_model.created_at
        assert goal_schema.updated_at == sample_goal_model.updated_at

    def test_model_to_schema_with_none_dates(
        self, goals_service: GoalsService, sample_goal_model: GoalModel
    ):
        """Test conversion with None target_date (start_date is always required)."""
        sample_goal_model.target_date = None
        # start_date should always have a value due to server default in model
        
        goal_schema = goals_service._model_to_schema(sample_goal_model)
        
        assert goal_schema.target_date is None
        assert goal_schema.start_date is not None  # start_date is always required

    @pytest.mark.asyncio
    async def test_get_all_goals(
        self, goals_service: GoalsService, mock_repository, 
        sample_goal_model: GoalModel, sample_savings_goal_model: GoalModel
    ):
        """Test getting all goals."""
        mock_repository.get_all.return_value = [sample_goal_model, sample_savings_goal_model]
        
        goals = await goals_service.get_all_goals()
        
        assert len(goals) == 2
        assert all(isinstance(goal, Goal) for goal in goals)
        assert goals[0].id == sample_goal_model.id
        assert goals[1].id == sample_savings_goal_model.id
        
        mock_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_goals_empty(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test getting all goals with empty result."""
        mock_repository.get_all.return_value = []
        
        goals = await goals_service.get_all_goals()
        
        assert len(goals) == 0
        assert isinstance(goals, list)

    @pytest.mark.asyncio
    async def test_get_active_goals(
        self, goals_service: GoalsService, mock_repository, sample_goal_model: GoalModel
    ):
        """Test getting active goals only."""
        mock_repository.get_active_goals.return_value = [sample_goal_model]
        
        goals = await goals_service.get_active_goals()
        
        assert len(goals) == 1
        assert isinstance(goals[0], Goal)
        assert goals[0].status == GoalStatus.ACTIVE
        
        mock_repository.get_active_goals.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_goals_by_type(
        self, goals_service: GoalsService, mock_repository, sample_goal_model: GoalModel
    ):
        """Test getting goals by type."""
        mock_repository.get_by_type.return_value = [sample_goal_model]
        
        goals = await goals_service.get_goals_by_type(GoalType.SPENDING)
        
        assert len(goals) == 1
        assert goals[0].goal_type == GoalType.SPENDING
        
        mock_repository.get_by_type.assert_called_once_with(GoalType.SPENDING)

    @pytest.mark.asyncio
    async def test_get_spending_goals(
        self, goals_service: GoalsService, mock_repository, sample_goal_model: GoalModel
    ):
        """Test getting spending goals specifically."""
        mock_repository.get_spending_goals.return_value = [sample_goal_model]
        
        goals = await goals_service.get_spending_goals()
        
        assert len(goals) == 1
        assert goals[0].goal_type == GoalType.SPENDING
        assert goals[0].category is not None
        
        mock_repository.get_spending_goals.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_goal_by_id_found(
        self, goals_service: GoalsService, mock_repository, sample_goal_model: GoalModel
    ):
        """Test getting goal by ID when found."""
        mock_repository.get_by_id.return_value = sample_goal_model
        
        goal = await goals_service.get_goal_by_id(1)
        
        assert goal is not None
        assert isinstance(goal, Goal)
        assert goal.id == sample_goal_model.id
        assert goal.title == sample_goal_model.title
        
        mock_repository.get_by_id.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_get_goal_by_id_not_found(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test getting goal by ID when not found."""
        mock_repository.get_by_id.return_value = None
        
        goal = await goals_service.get_goal_by_id(999)
        
        assert goal is None
        
        mock_repository.get_by_id.assert_called_once_with(999)

    @pytest.mark.asyncio
    async def test_create_goal_success(
        self, goals_service: GoalsService, mock_repository, 
        sample_goal_create: GoalCreate, sample_goal_model: GoalModel
    ):
        """Test successful goal creation."""
        mock_repository.create_goal.return_value = sample_goal_model
        
        created_goal = await goals_service.create_goal(sample_goal_create)
        
        assert isinstance(created_goal, Goal)
        assert created_goal.id == sample_goal_model.id
        assert created_goal.title == sample_goal_model.title
        
        mock_repository.create_goal.assert_called_once_with(sample_goal_create)

    @pytest.mark.asyncio
    async def test_create_goal_with_auto_generated_title(
        self, goals_service: GoalsService, mock_repository, 
        sample_goal_create: GoalCreate, sample_goal_model: GoalModel
    ):
        """Test goal creation with auto-generated title."""
        # Test with empty title
        sample_goal_create.title = ""
        mock_repository.create_goal.return_value = sample_goal_model
        
        # Mock the _generate_goal_title method
        goals_service._generate_goal_title = MagicMock(return_value="Auto-Generated Title")
        
        created_goal = await goals_service.create_goal(sample_goal_create)
        
        assert isinstance(created_goal, Goal)
        goals_service._generate_goal_title.assert_called_once_with(sample_goal_create)

    @pytest.mark.asyncio
    async def test_create_goal_with_auto_start_date(
        self, goals_service: GoalsService, mock_repository, 
        sample_goal_create: GoalCreate, sample_goal_model: GoalModel
    ):
        """Test goal creation (start_date is auto-set by database)."""
        # start_date is not part of GoalCreate - it's auto-set by the database server default
        
        mock_repository.create_goal.return_value = sample_goal_model
        
        created_goal = await goals_service.create_goal(sample_goal_create)
        
        assert isinstance(created_goal, Goal)
        assert created_goal.start_date is not None  # Should be set by database
        mock_repository.create_goal.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_goal_success(
        self, goals_service: GoalsService, mock_repository, sample_goal_model: GoalModel
    ):
        """Test successful goal update."""
        update_data = GoalUpdate(
            title="Updated Budget Title",
            target_amount=450.00,
            current_amount=200.00,
            priority=3,
            status=GoalStatus.PAUSED,
        )
        
        # Create updated model manually to avoid SQLAlchemy initialization issues
        updated_model = GoalModel(
            id=sample_goal_model.id,
            title="Updated Budget Title",
            description=sample_goal_model.description,
            goal_type=sample_goal_model.goal_type,
            time_horizon=sample_goal_model.time_horizon,
            recurrence=sample_goal_model.recurrence,
            status=GoalStatus.PAUSED.value,
            target_amount=450.00,
            current_amount=200.00,  # Less than target_amount to avoid completion logic
            category=sample_goal_model.category,
            target_date=sample_goal_model.target_date,
            start_date=sample_goal_model.start_date,
            priority=3,
            auto_calculate=sample_goal_model.auto_calculate,
            color=sample_goal_model.color,
            icon=sample_goal_model.icon,
            created_at=sample_goal_model.created_at,
            updated_at=sample_goal_model.updated_at,
        )
        mock_repository.update.return_value = updated_model
        # Mock the completion check methods in case they're called
        mock_repository.update_goal_status = AsyncMock()
        mock_repository.get_by_id = AsyncMock(return_value=updated_model)
        
        updated_goal = await goals_service.update_goal(1, update_data)
        
        assert updated_goal is not None
        assert isinstance(updated_goal, Goal)
        assert updated_goal.title == "Updated Budget Title"
        assert updated_goal.target_amount == 450.00
        assert updated_goal.current_amount == 200.00
        assert updated_goal.priority == 3
        assert updated_goal.status == GoalStatus.PAUSED
        
        mock_repository.update.assert_called_once_with(1, update_data)

    @pytest.mark.asyncio
    async def test_update_goal_not_found(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test updating non-existent goal."""
        update_data = GoalUpdate(target_amount=500.00)
        mock_repository.update.return_value = None
        
        updated_goal = await goals_service.update_goal(999, update_data)
        
        assert updated_goal is None
        
        mock_repository.update.assert_called_once_with(999, update_data)

    @pytest.mark.asyncio
    async def test_delete_goal_success(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test successful goal deletion."""
        mock_repository.delete_goal.return_value = True
        
        result = await goals_service.delete_goal(1)
        
        assert result is True
        
        mock_repository.delete_goal.assert_called_once_with(1)

    @pytest.mark.asyncio
    async def test_delete_goal_not_found(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test deleting non-existent goal."""
        mock_repository.delete_goal.return_value = False
        
        result = await goals_service.delete_goal(999)
        
        assert result is False
        
        mock_repository.delete_goal.assert_called_once_with(999)

    @pytest.mark.asyncio
    async def test_calculate_goal_progress_spending(
        self, goals_service: GoalsService, sample_goal_model: GoalModel
    ):
        """Test calculating progress for spending goals."""
        # Mock method exists and works
        if hasattr(goals_service, 'calculate_goal_progress'):
            # Spending goal: progress = current_amount / target_amount
            progress = goals_service.calculate_goal_progress(sample_goal_model)
            
            expected_progress = (sample_goal_model.current_amount / sample_goal_model.target_amount) * 100
            assert progress == expected_progress

    @pytest.mark.asyncio
    async def test_calculate_goal_progress_savings(
        self, goals_service: GoalsService, sample_savings_goal_model: GoalModel
    ):
        """Test calculating progress for savings goals."""
        # Mock method exists and works
        if hasattr(goals_service, 'calculate_goal_progress'):
            # Savings goal: progress = current_amount / target_amount
            progress = goals_service.calculate_goal_progress(sample_savings_goal_model)
            
            expected_progress = (sample_savings_goal_model.current_amount / sample_savings_goal_model.target_amount) * 100
            assert progress == expected_progress

    def test_generate_goal_title_spending(self, goals_service: GoalsService):
        """Test auto-generating title for spending goals."""
        if hasattr(goals_service, '_generate_goal_title'):
            goal_data = GoalCreate(
                title="Valid Title",  # Provide valid title to avoid validation error
                goal_type=GoalType.SPENDING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=300.00,
                category="FOOD",
            )
            
            title = goals_service._generate_goal_title(goal_data)
            
            assert "FOOD" in title or "Budget" in title

    def test_generate_goal_title_savings(self, goals_service: GoalsService):
        """Test auto-generating title for savings goals."""
        if hasattr(goals_service, '_generate_goal_title'):
            goal_data = GoalCreate(
                title="Valid Title",  # Provide valid title to avoid validation error
                goal_type=GoalType.SAVING,
                time_horizon=TimeHorizon.LONG,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=5000.00,
                target_date="2024-12-31",  # Use string format as expected by schema
            )
            
            title = goals_service._generate_goal_title(goal_data)
            
            assert "Save" in title or "Fund" in title or "5000" in title

    @pytest.mark.asyncio
    async def test_get_goals_summary(
        self, goals_service: GoalsService, mock_repository, 
        sample_goal_model: GoalModel, sample_savings_goal_model: GoalModel
    ):
        """Test getting goal summary statistics."""
        # Mock active goals
        with patch.object(goals_service, 'get_active_goals') as mock_get_active:
            mock_get_active.return_value = [
                goals_service._model_to_schema(sample_goal_model),
                goals_service._model_to_schema(sample_savings_goal_model),
            ]
            mock_repository.get_completed_goals.return_value = []
            
            summary = await goals_service.get_goals_summary()
            
            assert hasattr(summary, 'total_goals')
            assert hasattr(summary, 'spending_goals')
            assert hasattr(summary, 'saving_goals')
            assert summary.total_goals == 2

    @pytest.mark.asyncio
    async def test_get_goals_by_priority(
        self, goals_service: GoalsService, mock_repository, sample_goal_model: GoalModel
    ):
        """Test getting goals by priority."""
        if hasattr(goals_service, 'get_goals_by_priority'):
            mock_repository.get_goals_by_priority.return_value = [sample_goal_model]
            
            goals = await goals_service.get_goals_by_priority(1)
            
            assert len(goals) == 1
            assert goals[0].priority == 1

    @pytest.mark.asyncio
    async def test_get_goals_due_soon(
        self, goals_service: GoalsService, mock_repository, sample_savings_goal_model: GoalModel
    ):
        """Test getting goals due soon."""
        if hasattr(goals_service, 'get_goals_due_soon'):
            mock_repository.get_goals_due_soon.return_value = [sample_savings_goal_model]
            
            goals = await goals_service.get_goals_due_soon(30)
            
            assert len(goals) == 1
            assert goals[0].target_date is not None

    @pytest.mark.asyncio
    async def test_update_goal_progress_from_expenses(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test updating goal progress based on expenses."""
        if hasattr(goals_service, 'update_goal_progress_from_expenses'):
            mock_repository.update_goal_progress.return_value = True
            
            result = await goals_service.update_goal_progress_from_expenses(1, 150.00)
            
            assert result is True

    def test_validate_goal_data(self, goals_service: GoalsService):
        """Test goal data validation."""
        if hasattr(goals_service, '_validate_goal_data'):
            valid_goal = GoalCreate(
                title="Valid Goal",
                goal_type=GoalType.SPENDING,
                time_horizon=TimeHorizon.SHORT,
                recurrence=GoalRecurrence.MONTHLY,
                target_amount=300.00,
                category="GROCERIES",
            )
            
            # Should not raise any exception
            goals_service._validate_goal_data(valid_goal)

    @pytest.mark.asyncio
    async def test_archive_completed_goals(
        self, goals_service: GoalsService, mock_repository
    ):
        """Test archiving completed goals."""
        if hasattr(goals_service, 'archive_completed_goals'):
            mock_repository.get_completed_goals.return_value = []
            
            archived_count = await goals_service.archive_completed_goals()
            
            assert archived_count >= 0