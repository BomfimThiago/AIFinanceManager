"""Update upload history table with user_id and file_size

Revision ID: a9878ef5d344
Revises: 15346490e668
Create Date: 2025-07-23 16:51:10.116234

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9878ef5d344'
down_revision: Union[str, Sequence[str], None] = '15346490e668'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('upload_history', sa.Column('user_id', sa.Integer(), nullable=False))
    op.add_column('upload_history', sa.Column('file_size', sa.Integer(), nullable=False))
    op.add_column('upload_history', sa.Column('error_message', sa.Text(), nullable=True))
    op.create_index(op.f('ix_upload_history_user_id'), 'upload_history', ['user_id'], unique=False)
    op.create_foreign_key(None, 'upload_history', 'users', ['user_id'], ['id'])
    op.drop_column('upload_history', 'details')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('upload_history', sa.Column('details', sa.TEXT(), autoincrement=False, nullable=True))
    op.drop_constraint(None, 'upload_history', type_='foreignkey')
    op.drop_index(op.f('ix_upload_history_user_id'), table_name='upload_history')
    op.drop_column('upload_history', 'error_message')
    op.drop_column('upload_history', 'file_size')
    op.drop_column('upload_history', 'user_id')
    # ### end Alembic commands ###
