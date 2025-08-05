"""add_income_goal_links_table

Revision ID: c4d5e6f7a8b9
Revises: b3d4c5e6f7a8
Create Date: 2025-08-05 04:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b3d4c5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create income_goal_links table."""
    op.create_table(
        'income_goal_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('expense_id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('amount_allocated', sa.Float(), nullable=False),
        sa.Column('allocation_percentage', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('ai_suggested', sa.Boolean(), nullable=False, default=False),
        sa.Column('ai_confidence', sa.Float(), nullable=True),
        sa.Column('ai_reasoning', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('income_goal_links_expense_id_idx'), 'income_goal_links', ['expense_id'], unique=False)
    op.create_index(op.f('income_goal_links_goal_id_idx'), 'income_goal_links', ['goal_id'], unique=False)
    op.create_index(op.f('income_goal_links_id_idx'), 'income_goal_links', ['id'], unique=False)


def downgrade() -> None:
    """Drop income_goal_links table."""
    op.drop_index(op.f('income_goal_links_id_idx'), table_name='income_goal_links')
    op.drop_index(op.f('income_goal_links_goal_id_idx'), table_name='income_goal_links')
    op.drop_index(op.f('income_goal_links_expense_id_idx'), table_name='income_goal_links')
    op.drop_table('income_goal_links')