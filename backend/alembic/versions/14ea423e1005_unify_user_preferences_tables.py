"""unify_user_preferences_tables

Revision ID: 14ea423e1005
Revises: f5f47a3090cb
Create Date: 2025-07-30 05:43:25.756765

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14ea423e1005'
down_revision: Union[str, Sequence[str], None] = 'f5f47a3090cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
