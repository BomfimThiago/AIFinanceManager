"""add_categories_table

Revision ID: 838dc7e9e753
Revises: 90192de30b17
Create Date: 2025-07-29 16:11:33.357715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '838dc7e9e753'
down_revision: Union[str, Sequence[str], None] = '90192de30b17'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('user_id', sa.Integer(), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    
    # Create unique constraint for category names
    op.create_unique_constraint('uq_categories_name', 'categories', ['name'])
    
    # Create index for user categories
    op.create_index('ix_categories_user_id', 'categories', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the categories table
    op.drop_table('categories')
