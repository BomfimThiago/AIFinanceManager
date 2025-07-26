"""fix_belvo_institution_enum_types

Revision ID: a59057a97f01
Revises: 9046330b2da2
Create Date: 2025-07-26 03:36:48.213543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a59057a97f01'
down_revision: Union[str, Sequence[str], None] = '9046330b2da2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the correct enum types
    op.execute("CREATE TYPE belvoinstitutionstatus AS ENUM ('HEALTHY', 'DOWN', 'MAINTENANCE')")


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS belvoinstitutionstatus')
