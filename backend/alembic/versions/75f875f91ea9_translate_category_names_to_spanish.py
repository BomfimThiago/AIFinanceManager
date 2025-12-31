"""translate_category_names_to_spanish

Revision ID: 75f875f91ea9
Revises: 4e5cb0de18e3
Create Date: 2025-12-30 11:29:06.507774

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '75f875f91ea9'
down_revision: Union[str, None] = '4e5cb0de18e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TRANSLATIONS = {
    # Expense categories
    "groceries": ("Groceries", "Supermercado"),
    "dining": ("Dining", "Restaurantes"),
    "transportation": ("Transportation", "Transporte"),
    "utilities": ("Utilities", "Servicios"),
    "entertainment": ("Entertainment", "Entretenimiento"),
    "healthcare": ("Healthcare", "Salud"),
    "shopping": ("Shopping", "Compras"),
    "housing": ("Housing", "Vivienda"),
    "education": ("Education", "Educación"),
    "travel": ("Travel", "Viajes"),
    "rent": ("Rent", "Alquiler"),
    "energy": ("Energy/Power", "Energía"),
    "internet": ("Internet", "Internet"),
    "insurance": ("Insurance", "Seguros"),
    "subscriptions": ("Subscriptions", "Suscripciones"),
    "other_expense": ("Other Expense", "Otro Gasto"),
    # Income categories
    "salary": ("Salary", "Salario"),
    "freelance": ("Freelance", "Freelance"),
    "transfer_income": ("Transfer (Income)", "Transferencia"),
    "investment_returns": ("Investment Returns", "Inversiones"),
    "gifts": ("Gifts", "Regalos"),
    "refunds": ("Refunds", "Reembolsos"),
    "other_income": ("Other Income", "Otro Ingreso"),
}


def upgrade() -> None:
    for key, (_, spanish_name) in TRANSLATIONS.items():
        op.execute(
            sa.text(
                "UPDATE categories SET name = :name "
                "WHERE default_category_key = :key"
            ).bindparams(name=spanish_name, key=key)
        )


def downgrade() -> None:
    for key, (english_name, _) in TRANSLATIONS.items():
        op.execute(
            sa.text(
                "UPDATE categories SET name = :name "
                "WHERE default_category_key = :key"
            ).bindparams(name=english_name, key=key)
        )
