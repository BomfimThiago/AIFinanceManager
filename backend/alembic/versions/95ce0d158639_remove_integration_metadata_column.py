"""remove_integration_metadata_column

Revision ID: 95ce0d158639
Revises: 1765683d89d9
Create Date: 2025-07-26 03:23:12.355840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95ce0d158639'
down_revision: Union[str, Sequence[str], None] = '1765683d89d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove integration_metadata column from integrations table
    op.drop_column('integrations', 'integration_metadata')


def downgrade() -> None:
    """Downgrade schema."""
    # Add back integration_metadata column
    op.add_column('integrations', sa.Column('integration_metadata', sa.JSON(), nullable=True))
