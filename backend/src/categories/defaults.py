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
    # Expense categories
    DefaultCategory("groceries", "Groceries", CategoryType.EXPENSE, "cart", "#22c55e"),
    DefaultCategory("dining", "Dining", CategoryType.EXPENSE, "utensils", "#f97316"),
    DefaultCategory("transportation", "Transportation", CategoryType.EXPENSE, "car", "#3b82f6"),
    DefaultCategory("utilities", "Utilities", CategoryType.EXPENSE, "lightbulb", "#eab308"),
    DefaultCategory("entertainment", "Entertainment", CategoryType.EXPENSE, "film", "#a855f7"),
    DefaultCategory("healthcare", "Healthcare", CategoryType.EXPENSE, "heart-pulse", "#ef4444"),
    DefaultCategory("shopping", "Shopping", CategoryType.EXPENSE, "shopping-bag", "#ec4899"),
    DefaultCategory("housing", "Housing", CategoryType.EXPENSE, "home", "#6366f1"),
    DefaultCategory("education", "Education", CategoryType.EXPENSE, "book-open", "#14b8a6"),
    DefaultCategory("travel", "Travel", CategoryType.EXPENSE, "plane", "#06b6d4"),
    DefaultCategory("rent", "Rent", CategoryType.EXPENSE, "key", "#8b5cf6"),
    DefaultCategory("energy", "Energy/Power", CategoryType.EXPENSE, "zap", "#fbbf24"),
    DefaultCategory("internet", "Internet", CategoryType.EXPENSE, "wifi", "#0ea5e9"),
    DefaultCategory("insurance", "Insurance", CategoryType.EXPENSE, "shield", "#64748b"),
    DefaultCategory("subscriptions", "Subscriptions", CategoryType.EXPENSE, "repeat", "#f43f5e"),
    DefaultCategory("other_expense", "Other Expense", CategoryType.EXPENSE, "package", "#6b7280"),
    # Income categories
    DefaultCategory("salary", "Salary", CategoryType.INCOME, "briefcase", "#10b981"),
    DefaultCategory("freelance", "Freelance", CategoryType.INCOME, "laptop", "#8b5cf6"),
    DefaultCategory(
        "transfer_income", "Transfer (Income)", CategoryType.INCOME,
        "arrow-down-circle", "#3b82f6"
    ),
    DefaultCategory(
        "investment_returns", "Investment Returns", CategoryType.INCOME,
        "trending-up", "#22c55e"
    ),
    DefaultCategory("gifts", "Gifts", CategoryType.INCOME, "gift", "#ec4899"),
    DefaultCategory("refunds", "Refunds", CategoryType.INCOME, "rotate-ccw", "#f97316"),
    DefaultCategory("other_income", "Other Income", CategoryType.INCOME, "plus-circle", "#6b7280"),
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
