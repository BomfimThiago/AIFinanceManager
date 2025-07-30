"""add_server_defaults_to_user_category_preferences

Revision ID: f1dc8500de56
Revises: fb324328fe5e
Create Date: 2025-07-30 06:04:37.528796

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1dc8500de56'
down_revision: Union[str, Sequence[str], None] = 'fb324328fe5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add server defaults to user_category_preferences timestamp columns."""
    # Add server defaults for timestamp columns
    op.alter_column('user_category_preferences', 'created_at',
                   server_default=sa.text('now()'))
    op.alter_column('user_category_preferences', 'updated_at',
                   server_default=sa.text('now()'))
    op.alter_column('user_preferences', 'created_at',
                   server_default=sa.text('now()'))
    op.alter_column('user_preferences', 'updated_at',
                   server_default=sa.text('now()'))


def downgrade() -> None:
    """Remove server defaults from user_category_preferences timestamp columns."""
    # Remove server defaults for timestamp columns
    op.alter_column('user_category_preferences', 'created_at',
                   server_default=None)
    op.alter_column('user_category_preferences', 'updated_at',
                   server_default=None)
    op.alter_column('user_preferences', 'created_at',
                   server_default=None)
    op.alter_column('user_preferences', 'updated_at',
                   server_default=None)
