"""capitalize_existing_category_names

Revision ID: f5f47a3090cb
Revises: f40efbd28534
Create Date: 2025-07-30 05:38:07.843533

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5f47a3090cb'
down_revision: Union[str, Sequence[str], None] = 'f40efbd28534'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Capitalize existing category names."""
    # Get connection
    connection = op.get_bind()
    
    # First, delete any lowercase duplicates where a capitalized version already exists
    connection.execute(
        sa.text("""
            DELETE FROM categories c1
            WHERE EXISTS (
                SELECT 1 FROM categories c2 
                WHERE c2.name = INITCAP(c1.name) 
                AND c2.id != c1.id 
                AND c1.name != INITCAP(c1.name)
            )
        """)
    )
    
    # Now update remaining category names to be capitalized
    connection.execute(
        sa.text("""
            UPDATE categories 
            SET name = INITCAP(name)
            WHERE name != INITCAP(name)
        """)
    )


def downgrade() -> None:
    """Revert category names to lowercase."""
    # Get connection
    connection = op.get_bind()
    
    # Revert category names to lowercase
    connection.execute(
        sa.text("""
            UPDATE categories 
            SET name = LOWER(name)
            WHERE name != LOWER(name)
        """)
    )
