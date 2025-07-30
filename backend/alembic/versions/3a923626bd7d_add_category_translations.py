"""add_category_translations

Revision ID: 3a923626bd7d
Revises: f1dc8500de56
Create Date: 2025-07-30 13:44:28.118782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3a923626bd7d'
down_revision: Union[str, Sequence[str], None] = 'f1dc8500de56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add translations column to categories table
    op.add_column('categories', sa.Column('translations', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove translations column from categories table
    op.drop_column('categories', 'translations')