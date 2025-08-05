"""add_category_type_and_income_categories

Revision ID: b3d4c5e6f7a8
Revises: a2917f377b24
Create Date: 2025-08-05 04:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3d4c5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'a2917f377b24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add category_type column to categories table."""
    # Check if column already exists to handle local vs production differences
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('categories')]
    
    # Add category_type column if it doesn't exist
    if 'category_type' not in columns:
        op.add_column('categories', sa.Column('category_type', sa.String(length=10), nullable=False, server_default='expense'))
    
    # Remove the server_default after all existing rows have the value
    if 'category_type' not in columns:
        op.alter_column('categories', 'category_type', server_default=None)


def downgrade() -> None:
    """Remove category_type column from categories table."""
    op.drop_column('categories', 'category_type')