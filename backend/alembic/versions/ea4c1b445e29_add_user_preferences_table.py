"""add_user_preferences_table

Revision ID: ea4c1b445e29
Revises: 838dc7e9e753
Create Date: 2025-07-29 17:30:29.040923

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea4c1b445e29'
down_revision: Union[str, Sequence[str], None] = '838dc7e9e753'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('default_currency', sa.String(3), nullable=False, default='EUR'),
        sa.Column('language', sa.String(2), nullable=False, default='en'),
        sa.Column('ui_preferences', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    
    # Create unique constraint for user_id
    op.create_unique_constraint('uq_user_preferences_user_id', 'user_preferences', ['user_id'])
    
    # Create index for user_id
    op.create_index('ix_user_preferences_user_id', 'user_preferences', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the user_preferences table
    op.drop_table('user_preferences')
