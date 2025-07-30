"""update_category_translations_structure

Revision ID: c0897af8a437
Revises: 3a923626bd7d
Create Date: 2025-07-30 14:01:23.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c0897af8a437'
down_revision: Union[str, Sequence[str], None] = '3a923626bd7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - update translation structure from flat to nested."""
    # Update existing translations from flat structure {"en": "Food", "es": "Alimentación"} 
    # to nested structure {"name": {"en": "Food", "es": "Alimentación"}}
    
    # Create a SQL statement to update the translation structure
    op.execute("""
        UPDATE categories 
        SET translations = jsonb_build_object('name', translations::jsonb)
        WHERE translations IS NOT NULL 
        AND translations::jsonb ? 'en' 
        AND NOT translations::jsonb ? 'name'
    """)


def downgrade() -> None:
    """Downgrade schema - revert translation structure from nested to flat."""
    # Revert nested structure {"name": {"en": "Food", "es": "Alimentación"}} 
    # back to flat structure {"en": "Food", "es": "Alimentación"}
    
    op.execute("""
        UPDATE categories 
        SET translations = translations::jsonb->'name'
        WHERE translations IS NOT NULL 
        AND translations::jsonb ? 'name'
    """)