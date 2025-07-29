"""add_transaction_id_to_expenses_manual

Revision ID: 90192de30b17
Revises: d7ff2fa32bbd
Create Date: 2025-07-29 11:23:19.442308

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90192de30b17'
down_revision: Union[str, Sequence[str], None] = 'd7ff2fa32bbd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add transaction_id column to expenses table
    op.add_column('expenses', sa.Column('transaction_id', sa.String(), nullable=True))
    
    # Add index for transaction_id
    op.create_index(op.f('ix_expenses_transaction_id'), 'expenses', ['transaction_id'], unique=False)
    
    # Add unique constraint for transaction_id
    op.create_unique_constraint('uq_expenses_transaction_id', 'expenses', ['transaction_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Remove unique constraint
    op.drop_constraint('uq_expenses_transaction_id', 'expenses', type_='unique')
    
    # Remove index
    op.drop_index(op.f('ix_expenses_transaction_id'), table_name='expenses')
    
    # Remove column
    op.drop_column('expenses', 'transaction_id')
