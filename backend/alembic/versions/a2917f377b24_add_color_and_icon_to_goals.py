"""add_color_and_icon_to_goals

Revision ID: a2917f377b24
Revises: dc2269b55032
Create Date: 2025-08-04 18:09:17.208332

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2917f377b24'
down_revision: Union[str, Sequence[str], None] = 'dc2269b55032'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add color and icon columns to goals table."""
    # Check if columns already exist to handle local vs production differences
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('goals')]
    
    # Add color column if it doesn't exist
    if 'color' not in columns:
        op.add_column('goals', sa.Column('color', sa.String(length=10), nullable=True))
    
    # Add icon column if it doesn't exist  
    if 'icon' not in columns:
        op.add_column('goals', sa.Column('icon', sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Remove color and icon columns from goals table."""
    # Remove the columns in reverse order
    op.drop_column('goals', 'icon')
    op.drop_column('goals', 'color')
