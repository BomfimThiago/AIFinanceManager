"""
Unit tests for the insights service module.

Tests the InsightService class methods for business logic operations
including insight generation, AI integration, and summary calculations.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from datetime import datetime

from src.insights.models import InsightModel
from src.insights.repository import InsightRepository
from src.insights.schemas import Insight, InsightCreate, AIInsight, InsightSummary
from src.insights.service import InsightService
from src.categories.service import CategoryService
from src.shared.constants import InsightType


@pytest.mark.unit
@pytest.mark.insights
class TestInsightService:
    """Test cases for InsightService."""

    @pytest.fixture
    def mock_repository(self):
        """Create a mock InsightRepository."""
        return AsyncMock(spec=InsightRepository)

    @pytest.fixture
    def mock_category_service(self):
        """Create a mock CategoryService."""
        return AsyncMock(spec=CategoryService)

    @pytest.fixture
    def insight_service(self, mock_repository):
        """Create an InsightService with mock repository."""
        return InsightService(mock_repository)

    @pytest.fixture
    def insight_service_with_categories(self, mock_repository, mock_category_service):
        """Create an InsightService with mock repository and category service."""
        return InsightService(mock_repository, mock_category_service)

    @pytest.fixture
    def sample_insight_model(self):
        """Create a sample InsightModel for testing."""
        now = datetime.now()
        return InsightModel(
            id=1,
            title="Budget Alert",
            message="You're nearing your monthly budget limit",
            type=InsightType.WARNING.value,
            actionable="Consider reducing discretionary spending",
            created_at=now,
            updated_at=now,
        )

    @pytest.fixture
    def sample_insight_create(self):
        """Create sample insight creation data."""
        return InsightCreate(
            title="Savings Goal",
            message="You've reached 80% of your savings goal",
            type=InsightType.SUCCESS,
            actionable="Keep up the excellent saving habits",
        )

    @pytest.fixture
    def sample_ai_insights(self):
        """Create sample AI insights for testing."""
        return [
            AIInsight(
                title="Spending Pattern",
                message="Your spending has increased by 15% this month",
                type=InsightType.WARNING,
                actionable="Review your budget categories",
            ),
            AIInsight(
                title="Savings Achievement",
                message="You saved $200 more than last month",
                type=InsightType.SUCCESS,
                actionable="Consider increasing your savings rate",
            ),
        ]

    def test_model_to_schema_conversion(
        self, insight_service: InsightService, sample_insight_model: InsightModel
    ):
        """Test conversion from SQLAlchemy model to Pydantic schema."""
        insight_schema = insight_service._model_to_schema(sample_insight_model)
        
        assert isinstance(insight_schema, Insight)
        assert insight_schema.id == sample_insight_model.id
        assert insight_schema.title == sample_insight_model.title
        assert insight_schema.message == sample_insight_model.message
        assert insight_schema.type == sample_insight_model.type
        assert insight_schema.actionable == sample_insight_model.actionable

    def test_model_to_schema_with_missing_id(
        self, insight_service: InsightService
    ):
        """Test conversion with missing ID (using getattr with default)."""
        # Create a mock object without id attribute to test getattr fallback
        mock_model = MagicMock()
        mock_model.title = "Test"
        mock_model.message = "Test message"
        mock_model.type = InsightType.INFO.value
        mock_model.actionable = "Test action"
        mock_model.created_at = datetime.now()
        mock_model.updated_at = datetime.now()
        # Remove id attribute to test getattr fallback
        del mock_model.id
        
        insight_schema = insight_service._model_to_schema(mock_model)
        
        assert insight_schema.id == 0

    def test_model_to_ai_insight_conversion(
        self, insight_service: InsightService, sample_insight_model: InsightModel
    ):
        """Test conversion from SQLAlchemy model to AIInsight schema."""
        ai_insight = insight_service._model_to_ai_insight(sample_insight_model)
        
        assert isinstance(ai_insight, AIInsight)
        assert ai_insight.title == sample_insight_model.title
        assert ai_insight.message == sample_insight_model.message
        assert ai_insight.type == sample_insight_model.type
        assert ai_insight.actionable == sample_insight_model.actionable

    @pytest.mark.asyncio
    async def test_get_all_insights(
        self, insight_service: InsightService, mock_repository, sample_insight_model: InsightModel
    ):
        """Test getting all insights."""
        mock_repository.get_all.return_value = [sample_insight_model]
        
        insights = await insight_service.get_all()
        
        assert len(insights) == 1
        assert isinstance(insights[0], Insight)
        assert insights[0].id == sample_insight_model.id
        assert insights[0].title == sample_insight_model.title
        
        mock_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_insights_empty(
        self, insight_service: InsightService, mock_repository
    ):
        """Test getting all insights with empty result."""
        mock_repository.get_all.return_value = []
        
        insights = await insight_service.get_all()
        
        assert len(insights) == 0
        assert isinstance(insights, list)

    @pytest.mark.asyncio
    async def test_get_all_as_ai_insights(
        self, insight_service: InsightService, mock_repository, sample_insight_model: InsightModel
    ):
        """Test getting all insights as AIInsight objects."""
        mock_repository.get_all.return_value = [sample_insight_model]
        
        ai_insights = await insight_service.get_all_as_ai_insights()
        
        assert len(ai_insights) == 1
        assert isinstance(ai_insights[0], AIInsight)
        assert ai_insights[0].title == sample_insight_model.title
        assert ai_insights[0].message == sample_insight_model.message
        
        mock_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_insight_success(
        self, insight_service: InsightService, mock_repository, 
        sample_insight_create: InsightCreate, sample_insight_model: InsightModel
    ):
        """Test successful insight creation."""
        mock_repository.create.return_value = sample_insight_model
        
        created_insight = await insight_service.create(sample_insight_create)
        
        assert isinstance(created_insight, Insight)
        assert created_insight.id == sample_insight_model.id
        assert created_insight.title == sample_insight_model.title
        
        mock_repository.create.assert_called_once_with(sample_insight_create)

    @pytest.mark.asyncio
    async def test_delete_all_insights(
        self, insight_service: InsightService, mock_repository
    ):
        """Test deleting all insights."""
        mock_repository.delete_all.return_value = 5
        
        deleted_count = await insight_service.delete_all()
        
        assert deleted_count == 5
        mock_repository.delete_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_summary_with_mixed_types(
        self, insight_service: InsightService, mock_repository
    ):
        """Test getting insight summary with different types."""
        now = datetime.now()
        sample_insights = [
            InsightModel(
                id=1,
                title="Warning 1",
                message="Warning message",
                type=InsightType.WARNING.value,
                actionable="Take action",
                created_at=now,
                updated_at=now,
            ),
            InsightModel(
                id=2,
                title="Warning 2", 
                message="Another warning",
                type=InsightType.WARNING.value,
                actionable="Take action",
                created_at=now,
                updated_at=now,
            ),
            InsightModel(
                id=3,
                title="Success",
                message="Success message",
                type=InsightType.SUCCESS.value,
                actionable="Keep it up",
                created_at=now,
                updated_at=now,
            ),
            InsightModel(
                id=4,
                title="Info",
                message="Info message",
                type=InsightType.INFO.value,
                actionable=None,
                created_at=now,
                updated_at=now,
            ),
        ]
        
        mock_repository.get_all.return_value = sample_insights
        
        summary = await insight_service.get_summary()
        
        assert isinstance(summary, InsightSummary)
        assert summary.total_insights == 4
        assert summary.warning_count == 2
        assert summary.success_count == 1
        assert summary.info_count == 1
        assert len(summary.insights) == 4
        
        mock_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_summary_empty(
        self, insight_service: InsightService, mock_repository
    ):
        """Test getting insight summary with no insights."""
        mock_repository.get_all.return_value = []
        
        summary = await insight_service.get_summary()
        
        assert summary.total_insights == 0
        assert summary.warning_count == 0
        assert summary.success_count == 0
        assert summary.info_count == 0
        assert len(summary.insights) == 0

    @pytest.mark.asyncio
    @patch('src.insights.service.AIService')
    async def test_generate_insights_success(
        self, mock_ai_service_class, insight_service_with_categories: InsightService, 
        mock_repository, mock_category_service, sample_ai_insights
    ):
        """Test successful insight generation."""
        # Mock AI service instance and its methods
        mock_ai_service_instance = AsyncMock()
        mock_ai_service_instance.generate_insights.return_value = sample_ai_insights
        mock_ai_service_class.return_value = mock_ai_service_instance
        
        # Mock repository methods
        mock_repository.delete_all.return_value = 2
        mock_repository.create_multiple_from_ai_insights.return_value = []
        
        # Sample data
        expenses = [{"amount": 100, "category": "FOOD"}]
        budgets_dict = {"FOOD": {"limit": 500, "spent": 300}}
        
        generated_insights = await insight_service_with_categories.generate_insights(
            expenses, budgets_dict
        )
        
        # Verify AI service was created with category service
        mock_ai_service_class.assert_called_once_with(mock_category_service)
        
        # Verify AI service generate_insights was called
        mock_ai_service_instance.generate_insights.assert_called_once_with(expenses, budgets_dict)
        
        # Verify repository operations
        mock_repository.delete_all.assert_called_once()
        mock_repository.create_multiple_from_ai_insights.assert_called_once_with(sample_ai_insights)
        
        # Verify return value
        assert len(generated_insights) == 2
        assert generated_insights[0].title == "Spending Pattern"
        assert generated_insights[1].title == "Savings Achievement"

    @pytest.mark.asyncio
    @patch('src.insights.service.AIService')
    async def test_generate_insights_ai_service_failure(
        self, mock_ai_service_class, insight_service_with_categories: InsightService, 
        mock_repository, mock_category_service
    ):
        """Test insight generation with AI service failure."""
        # Mock AI service to raise exception
        mock_ai_service_instance = AsyncMock()
        mock_ai_service_instance.generate_insights.side_effect = Exception("AI service error")
        mock_ai_service_class.return_value = mock_ai_service_instance
        
        expenses = []
        budgets_dict = {}
        
        generated_insights = await insight_service_with_categories.generate_insights(
            expenses, budgets_dict
        )
        
        # Should return empty list on error
        assert generated_insights == []
        
        # Verify AI service was called
        mock_ai_service_instance.generate_insights.assert_called_once()
        
        # Repository delete_all should NOT be called when AI service fails
        # (it's only called after successful AI generation)
        mock_repository.delete_all.assert_not_called()
        
        # create_multiple should not be called due to error
        mock_repository.create_multiple_from_ai_insights.assert_not_called()

    @pytest.mark.asyncio
    async def test_generate_insights_without_category_service(
        self, insight_service: InsightService, mock_repository
    ):
        """Test insight generation without category service."""
        with patch('src.insights.service.AIService') as mock_ai_service_class:
            mock_ai_service_instance = AsyncMock()
            mock_ai_service_instance.generate_insights.return_value = []
            mock_ai_service_class.return_value = mock_ai_service_instance
            
            mock_repository.delete_all.return_value = 0
            mock_repository.create_multiple_from_ai_insights.return_value = []
            
            expenses = []
            budgets_dict = {}
            
            generated_insights = await insight_service.generate_insights(expenses, budgets_dict)
            
            # AI service should be created with None category service
            mock_ai_service_class.assert_called_once_with(None)
            
            assert generated_insights == []

    @pytest.mark.asyncio
    async def test_repository_create_multiple_failure(
        self, insight_service_with_categories: InsightService, mock_repository, 
        mock_category_service, sample_ai_insights
    ):
        """Test handling of repository failure during insight creation."""
        with patch('src.insights.service.AIService') as mock_ai_service_class:
            mock_ai_service_instance = AsyncMock()
            mock_ai_service_instance.generate_insights.return_value = sample_ai_insights
            mock_ai_service_class.return_value = mock_ai_service_instance
            
            # Mock repository methods - delete succeeds, create fails
            mock_repository.delete_all.return_value = 0
            mock_repository.create_multiple_from_ai_insights.side_effect = Exception("DB error")
            
            expenses = []
            budgets_dict = {}
            
            generated_insights = await insight_service_with_categories.generate_insights(
                expenses, budgets_dict
            )
            
            # Should return empty list on repository error
            assert generated_insights == []

    @pytest.mark.asyncio
    async def test_service_initialization_with_category_service(self, mock_repository, mock_category_service):
        """Test service initialization with category service."""
        service = InsightService(mock_repository, mock_category_service)
        
        assert service.repository == mock_repository
        assert service.category_service == mock_category_service

    @pytest.mark.asyncio
    async def test_service_initialization_without_category_service(self, mock_repository):
        """Test service initialization without category service."""
        service = InsightService(mock_repository)
        
        assert service.repository == mock_repository
        assert service.category_service is None

    def test_insight_type_counting_logic(self, insight_service: InsightService):
        """Test the logic for counting different insight types."""
        # Create insights with different types
        insights = [
            Insight(
                id=1, title="W1", message="msg", type=InsightType.WARNING, 
                actionable="action", created_at=MagicMock(), updated_at=MagicMock()
            ),
            Insight(
                id=2, title="W2", message="msg", type=InsightType.WARNING,
                actionable="action", created_at=MagicMock(), updated_at=MagicMock()
            ),
            Insight(
                id=3, title="S1", message="msg", type=InsightType.SUCCESS,
                actionable="action", created_at=MagicMock(), updated_at=MagicMock()
            ),
            Insight(
                id=4, title="I1", message="msg", type=InsightType.INFO,
                actionable=None, created_at=MagicMock(), updated_at=MagicMock()
            ),
        ]
        
        # Test counting logic manually (same as in get_summary)
        warning_count = sum(1 for insight in insights if insight.type == InsightType.WARNING)
        success_count = sum(1 for insight in insights if insight.type == InsightType.SUCCESS)
        info_count = sum(1 for insight in insights if insight.type == InsightType.INFO)
        
        assert warning_count == 2
        assert success_count == 1
        assert info_count == 1