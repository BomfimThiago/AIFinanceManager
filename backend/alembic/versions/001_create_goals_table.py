"""create_goals_table_for_unified_financial_goals

Revision ID: 001_goals
Revises: c0897af8a437
Create Date: 2025-07-31 12:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_goals'
down_revision: Union[str, Sequence[str], None] = 'c0897af8a437'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create goals table for unified financial goals system."""
    
    # Create the goals table
    op.create_table('goals',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        
        # Basic goal information
        sa.Column('title', sa.String(200), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        
        # Goal type and classification
        sa.Column('goal_type', sa.String(20), nullable=False, index=True),  # spending, saving, debt
        sa.Column('time_horizon', sa.String(20), nullable=False, index=True),  # short, medium, long
        sa.Column('recurrence', sa.String(20), nullable=False),  # one_time, weekly, monthly, etc.
        sa.Column('status', sa.String(20), nullable=False, server_default='active', index=True),
        
        # Financial amounts
        sa.Column('target_amount', sa.Float(), nullable=False),
        sa.Column('current_amount', sa.Float(), nullable=False, server_default='0.0'),
        
        # Category (for spending goals only)
        sa.Column('category', sa.String(100), nullable=True, index=True),
        
        # Time-based fields
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False, server_default=sa.func.current_date()),
        
        # Configuration
        sa.Column('auto_calculate', sa.Boolean(), nullable=False, server_default='true'),  # Auto-calc from expenses
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),  # 1=high, 2=medium, 3=low
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_goals_goal_type', 'goals', ['goal_type'])
    op.create_index('ix_goals_time_horizon', 'goals', ['time_horizon'])
    op.create_index('ix_goals_status', 'goals', ['status'])
    op.create_index('ix_goals_category', 'goals', ['category'])
    op.create_index('ix_goals_target_date', 'goals', ['target_date'])
    
    # Migrate existing budgets to goals
    # First, check if budgets table exists and has data
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'budgets'
        );
    """))
    
    budgets_table_exists = result.fetchone()[0]
    
    if budgets_table_exists:
        # Migrate existing budgets to spending goals
        op.execute(sa.text("""
            INSERT INTO goals (
                title, description, goal_type, time_horizon, recurrence, status,
                target_amount, current_amount, category, auto_calculate, priority,
                created_at, updated_at
            )
            SELECT 
                CONCAT(category, ' Budget') as title,
                CONCAT('Monthly spending limit for ', category) as description,
                'spending' as goal_type,
                'short' as time_horizon,
                'monthly' as recurrence,
                'active' as status,
                limit_amount as target_amount,
                spent_amount as current_amount,
                category,
                true as auto_calculate,
                1 as priority,
                created_at,
                updated_at
            FROM budgets;
        """))


def downgrade() -> None:
    """Drop goals table and restore budgets table."""
    
    # Recreate budgets table
    op.create_table('budgets',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('category', sa.String(), nullable=False, index=True),
        sa.Column('limit_amount', sa.Float(), nullable=False),
        sa.Column('spent_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create unique constraint on category
    op.create_unique_constraint('budgets_category_key', 'budgets', ['category'])
    
    # Migrate spending goals back to budgets
    op.execute(sa.text("""
        INSERT INTO budgets (category, limit_amount, spent_amount, created_at, updated_at)
        SELECT category, target_amount, current_amount, created_at, updated_at
        FROM goals 
        WHERE goal_type = 'spending' AND category IS NOT NULL;
    """))
    
    # Drop goals table and indexes
    op.drop_index('ix_goals_target_date', 'goals')
    op.drop_index('ix_goals_category', 'goals')
    op.drop_index('ix_goals_status', 'goals')
    op.drop_index('ix_goals_time_horizon', 'goals')
    op.drop_index('ix_goals_goal_type', 'goals')
    op.drop_table('goals')