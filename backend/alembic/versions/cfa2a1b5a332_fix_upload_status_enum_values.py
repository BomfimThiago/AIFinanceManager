"""Fix upload status enum values

Revision ID: cfa2a1b5a332
Revises: a9878ef5d344
Create Date: 2025-07-23 16:53:27.486545

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cfa2a1b5a332'
down_revision: Union[str, Sequence[str], None] = 'a9878ef5d344'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Clear any existing data and recreate the enum
    op.execute("DELETE FROM upload_history")
    
    # Drop and recreate the enum type with new values
    op.execute("ALTER TYPE uploadstatus RENAME TO uploadstatus_old")
    op.execute("CREATE TYPE uploadstatus AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED')")
    op.execute("ALTER TABLE upload_history ALTER COLUMN status TYPE uploadstatus USING 'PROCESSING'::uploadstatus")
    op.execute("DROP TYPE uploadstatus_old")


def downgrade() -> None:
    """Downgrade schema."""
    # Revert enum values
    op.execute("UPDATE upload_history SET status = 'COMPLETED' WHERE status = 'SUCCESS'")
    op.execute("UPDATE upload_history SET status = 'ERROR' WHERE status = 'FAILED'")
    
    # Recreate old enum type
    op.execute("ALTER TYPE uploadstatus RENAME TO uploadstatus_new")
    op.execute("CREATE TYPE uploadstatus AS ENUM ('PROCESSING', 'COMPLETED', 'ERROR')")
    op.execute("ALTER TABLE upload_history ALTER COLUMN status TYPE uploadstatus USING status::text::uploadstatus")
    op.execute("DROP TYPE uploadstatus_new")
