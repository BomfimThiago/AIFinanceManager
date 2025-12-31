"""add_user_category_preferences

Revision ID: 4e5cb0de18e3
Revises: 436594e5468e
Create Date: 2025-12-30 11:05:34.488809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e5cb0de18e3'
down_revision: Union[str, None] = '436594e5468e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_category_preferences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("item_name_pattern", sa.String(255), nullable=False),
        sa.Column("store_name_pattern", sa.String(255), nullable=True),
        sa.Column("target_category", sa.String(50), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("correction_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "last_used_at", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column("original_category", sa.String(50), nullable=True),
        sa.Column("source_expense_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["source_expense_id"], ["expenses.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for efficient lookups
    op.create_index(
        "ix_user_category_preferences_user_id",
        "user_category_preferences",
        ["user_id"],
    )
    op.create_index(
        "ix_user_category_preferences_lookup",
        "user_category_preferences",
        ["user_id", "item_name_pattern"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_user_category_preferences_lookup", table_name="user_category_preferences"
    )
    op.drop_index(
        "ix_user_category_preferences_user_id", table_name="user_category_preferences"
    )
    op.drop_table("user_category_preferences")
