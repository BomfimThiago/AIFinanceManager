"""
Category constants and default category definitions.

This module contains the default categories that are automatically
created when the system starts up.
"""

from typing import TypedDict

from src.categories.models import CategoryType


class DefaultCategory(TypedDict):
    """Type definition for default category data."""

    name: str
    description: str
    color: str
    icon: str
    category_type: str


# Default expense categories that are created on system startup
DEFAULT_EXPENSE_CATEGORIES: list[DefaultCategory] = [
    {
        "name": "Food",
        "description": "Food and dining expenses",
        "color": "#FF6B6B",
        "icon": "utensils",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Transport",
        "description": "Transportation and travel costs",
        "color": "#4ECDC4",
        "icon": "car",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Shopping",
        "description": "Shopping and retail purchases",
        "color": "#45B7D1",
        "icon": "shopping-bag",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Entertainment",
        "description": "Entertainment and leisure activities",
        "color": "#96CEB4",
        "icon": "film",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Utilities",
        "description": "Utilities and bills (electricity, water, internet)",
        "color": "#FFEAA7",
        "icon": "zap",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Healthcare",
        "description": "Healthcare and medical expenses",
        "color": "#FD79A8",
        "icon": "heart",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Education",
        "description": "Education and learning expenses",
        "color": "#6C5CE7",
        "icon": "book",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Home",
        "description": "Home and household expenses",
        "color": "#A29BFE",
        "icon": "home",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Clothing",
        "description": "Clothing and fashion expenses",
        "color": "#FD79A8",
        "icon": "shirt",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Technology",
        "description": "Technology and gadgets",
        "color": "#74B9FF",
        "icon": "laptop",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Fitness",
        "description": "Fitness and sports activities",
        "color": "#00B894",
        "icon": "dumbbell",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Travel",
        "description": "Travel and vacation expenses",
        "color": "#FDCB6E",
        "icon": "plane",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Gifts",
        "description": "Gifts and donations",
        "color": "#E17055",
        "icon": "gift",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Pets",
        "description": "Pet care and expenses",
        "color": "#81ECEC",
        "icon": "heart",
        "category_type": CategoryType.EXPENSE.value,
    },
    {
        "name": "Other",
        "description": "Other miscellaneous expenses",
        "color": "#636E72",
        "icon": "more-horizontal",
        "category_type": CategoryType.EXPENSE.value,
    },
]

# Default income categories that are created on system startup
DEFAULT_INCOME_CATEGORIES: list[DefaultCategory] = [
    {
        "name": "Salary",
        "description": "Monthly salary or wage income",
        "color": "#00B894",
        "icon": "briefcase",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Pix",
        "description": "Pix transfers received",
        "color": "#00CEC9",
        "icon": "zap",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Bank Transfer",
        "description": "Bank transfers and wire transfers received",
        "color": "#0984E3",
        "icon": "building-2",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Investment",
        "description": "Investment returns, dividends, and interest",
        "color": "#6C5CE7",
        "icon": "trending-up",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Bonus",
        "description": "Bonuses, commissions, and extra income",
        "color": "#FDCB6E",
        "icon": "award",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Freelance",
        "description": "Freelance and consulting income",
        "color": "#E17055",
        "icon": "user-check",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Business",
        "description": "Business revenue and sales",
        "color": "#74B9FF",
        "icon": "store",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Rental",
        "description": "Rental income from properties",
        "color": "#A29BFE",
        "icon": "home",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Gift",
        "description": "Monetary gifts received",
        "color": "#FD79A8",
        "icon": "gift",
        "category_type": CategoryType.INCOME.value,
    },
    {
        "name": "Other Income",
        "description": "Other miscellaneous income",
        "color": "#95A5A6",
        "icon": "plus-circle",
        "category_type": CategoryType.INCOME.value,
    },
]

# Combined list of all default categories
DEFAULT_CATEGORIES: list[DefaultCategory] = (
    DEFAULT_EXPENSE_CATEGORIES + DEFAULT_INCOME_CATEGORIES
)
