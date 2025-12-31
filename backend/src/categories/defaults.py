from dataclasses import dataclass

from src.shared.constants import CategoryType


@dataclass(frozen=True)
class DefaultCategory:
    key: str
    name: str
    type: CategoryType
    icon: str
    color: str


DEFAULT_CATEGORIES: list[DefaultCategory] = [
    # Expense categories (Categorías de gastos)
    DefaultCategory("groceries", "Supermercado", CategoryType.EXPENSE, "cart", "#22c55e"),
    DefaultCategory("dining", "Restaurantes", CategoryType.EXPENSE, "utensils", "#f97316"),
    DefaultCategory("transportation", "Transporte", CategoryType.EXPENSE, "car", "#3b82f6"),
    DefaultCategory("utilities", "Servicios", CategoryType.EXPENSE, "lightbulb", "#eab308"),
    DefaultCategory("entertainment", "Entretenimiento", CategoryType.EXPENSE, "film", "#a855f7"),
    DefaultCategory("healthcare", "Salud", CategoryType.EXPENSE, "heart-pulse", "#ef4444"),
    DefaultCategory("shopping", "Compras", CategoryType.EXPENSE, "shopping-bag", "#ec4899"),
    DefaultCategory("housing", "Vivienda", CategoryType.EXPENSE, "home", "#6366f1"),
    DefaultCategory("education", "Educación", CategoryType.EXPENSE, "book-open", "#14b8a6"),
    DefaultCategory("travel", "Viajes", CategoryType.EXPENSE, "plane", "#06b6d4"),
    DefaultCategory("rent", "Alquiler", CategoryType.EXPENSE, "key", "#8b5cf6"),
    DefaultCategory("energy", "Energía", CategoryType.EXPENSE, "zap", "#fbbf24"),
    DefaultCategory("internet", "Internet", CategoryType.EXPENSE, "wifi", "#0ea5e9"),
    DefaultCategory("insurance", "Seguros", CategoryType.EXPENSE, "shield", "#64748b"),
    DefaultCategory("subscriptions", "Suscripciones", CategoryType.EXPENSE, "repeat", "#f43f5e"),
    DefaultCategory("other_expense", "Otro Gasto", CategoryType.EXPENSE, "package", "#6b7280"),
    # Income categories (Categorías de ingresos)
    DefaultCategory("salary", "Salario", CategoryType.INCOME, "briefcase", "#10b981"),
    DefaultCategory("freelance", "Freelance", CategoryType.INCOME, "laptop", "#8b5cf6"),
    DefaultCategory(
        "transfer_income", "Transferencia", CategoryType.INCOME,
        "arrow-down-circle", "#3b82f6"
    ),
    DefaultCategory(
        "investment_returns", "Inversiones", CategoryType.INCOME,
        "trending-up", "#22c55e"
    ),
    DefaultCategory("gifts", "Regalos", CategoryType.INCOME, "gift", "#ec4899"),
    DefaultCategory("refunds", "Reembolsos", CategoryType.INCOME, "rotate-ccw", "#f97316"),
    DefaultCategory("other_income", "Otro Ingreso", CategoryType.INCOME, "plus-circle", "#6b7280"),
]


def get_default_category_by_key(key: str) -> DefaultCategory | None:
    """Get a default category by its key."""
    for category in DEFAULT_CATEGORIES:
        if category.key == key:
            return category
    return None


def get_expense_categories() -> list[DefaultCategory]:
    """Get all expense default categories."""
    return [c for c in DEFAULT_CATEGORIES if c.type == CategoryType.EXPENSE]


def get_income_categories() -> list[DefaultCategory]:
    """Get all income default categories."""
    return [c for c in DEFAULT_CATEGORIES if c.type == CategoryType.INCOME]
