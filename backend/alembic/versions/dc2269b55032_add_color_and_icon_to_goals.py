"""add_color_and_icon_to_goals

Revision ID: dc2269b55032
Revises: 25447e602986
Create Date: 2025-08-03 08:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'dc2269b55032'
down_revision: Union[str, Sequence[str], None] = '25447e602986'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add color and icon columns to goals table."""
    # Add color column for visual identification (hex color codes)
    op.add_column('goals', sa.Column('color', sa.String(10), nullable=True))
    
    # Add icon column for visual identification (icon names)
    op.add_column('goals', sa.Column('icon', sa.String(50), nullable=True))


def downgrade() -> None:
    """Remove color and icon columns from goals table."""
    # Remove the added columns
    op.drop_column('goals', 'icon')
    op.drop_column('goals', 'color')