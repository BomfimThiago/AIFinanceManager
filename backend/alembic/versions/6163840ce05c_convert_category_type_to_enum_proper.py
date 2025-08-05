"""convert_category_type_to_enum_proper

Revision ID: 6163840ce05c
Revises: c4d5e6f7a8b9
Create Date: 2025-08-05 05:00:06.761699

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6163840ce05c'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Convert category_type from string to enum type."""
    # Create the enum type if it doesn't exist
    categorytype_enum = sa.Enum('EXPENSE', 'INCOME', name='categorytype')
    categorytype_enum.create(op.get_bind(), checkfirst=True)
    
    # Convert existing values to uppercase
    op.execute("UPDATE categories SET category_type = UPPER(category_type)")
    
    # Convert the column to use the enum type
    op.alter_column('categories', 'category_type',
                   existing_type=sa.String(length=10),
                   type_=categorytype_enum,
                   existing_nullable=False,
                   postgresql_using='category_type::categorytype')


def downgrade() -> None:
    """Convert category_type back to string type."""
    # Convert the column back to string
    op.alter_column('categories', 'category_type',
                   existing_type=sa.Enum('EXPENSE', 'INCOME', name='categorytype'),
                   type_=sa.String(length=10),
                   existing_nullable=False)
    
    # Convert values back to lowercase
    op.execute("UPDATE categories SET category_type = LOWER(category_type)")
    
    # Drop the enum type
    sa.Enum(name='categorytype').drop(op.get_bind())
