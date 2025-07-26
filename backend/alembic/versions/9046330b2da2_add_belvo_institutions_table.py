"""add_belvo_institutions_table

Revision ID: 9046330b2da2
Revises: 95ce0d158639
Create Date: 2025-07-26 03:30:25.412177

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9046330b2da2'
down_revision: Union[str, Sequence[str], None] = '95ce0d158639'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create belvo_institutions table
    op.create_table('belvo_institutions',
        sa.Column('belvo_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('BANK', 'BUSINESS', 'FISCAL', name='belvoinstitutiontype'), nullable=False),
        sa.Column('status', sa.Enum('HEALTHY', 'DOWN', 'MAINTENANCE', name='belvoinstitutionstatus'), nullable=False),
        sa.Column('country_code', sa.String(length=2), nullable=False),
        sa.Column('country_codes', sa.JSON(), nullable=False),
        sa.Column('primary_color', sa.String(length=7), nullable=False),
        sa.Column('logo', sa.Text(), nullable=True),
        sa.Column('icon_logo', sa.Text(), nullable=True),
        sa.Column('text_logo', sa.Text(), nullable=True),
        sa.Column('website', sa.String(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('belvo_id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_belvo_institutions_belvo_id'), 'belvo_institutions', ['belvo_id'], unique=False)
    op.create_index(op.f('ix_belvo_institutions_country_code'), 'belvo_institutions', ['country_code'], unique=False)
    op.create_index(op.f('ix_belvo_institutions_id'), 'belvo_institutions', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop belvo_institutions table
    op.drop_index(op.f('ix_belvo_institutions_id'), table_name='belvo_institutions')
    op.drop_index(op.f('ix_belvo_institutions_country_code'), table_name='belvo_institutions')
    op.drop_index(op.f('ix_belvo_institutions_belvo_id'), table_name='belvo_institutions')
    op.drop_table('belvo_institutions')
    op.execute('DROP TYPE IF EXISTS belvoinstitutiontype')
    op.execute('DROP TYPE IF EXISTS belvoinstitutionstatus')
