"""add belvo-integration to expensesource enum

Revision ID: 09f0b8b0a20c
Revises: 763d2855fd0b
Create Date: 2025-07-26 13:48:25.340957

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09f0b8b0a20c'
down_revision: Union[str, Sequence[str], None] = '763d2855fd0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add 'belvo-integration' value to expensesource enum
    op.execute("ALTER TYPE expensesource ADD VALUE 'belvo-integration'")


def downgrade() -> None:
    """Downgrade schema."""
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all references
    # For safety, we'll leave this as a no-op
    # If rollback is needed, it should be done manually
    pass
