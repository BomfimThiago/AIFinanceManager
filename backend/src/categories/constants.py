"""
Category constants and default category definitions.

This module contains the default categories that are automatically
created when the system starts up.
"""

from typing import TypedDict


class DefaultCategory(TypedDict):
    """Type definition for default category data."""

    name: str
    description: str
    color: str
    icon: str


# Default categories that are created on system startup
DEFAULT_CATEGORIES: list[DefaultCategory] = [
    {
        "name": "Food",
        "description": "Food and dining expenses",
        "color": "#FF6B6B",
        "icon": "utensils",
    },
    {
        "name": "Transport",
        "description": "Transportation and travel costs",
        "color": "#4ECDC4",
        "icon": "car",
    },
    {
        "name": "Shopping",
        "description": "Shopping and retail purchases",
        "color": "#45B7D1",
        "icon": "shopping-bag",
    },
    {
        "name": "Entertainment",
        "description": "Entertainment and leisure activities",
        "color": "#96CEB4",
        "icon": "film",
    },
    {
        "name": "Utilities",
        "description": "Utilities and bills (electricity, water, internet)",
        "color": "#FFEAA7",
        "icon": "zap",
    },
    {
        "name": "Healthcare",
        "description": "Healthcare and medical expenses",
        "color": "#FD79A8",
        "icon": "heart",
    },
    {
        "name": "Education",
        "description": "Education and learning expenses",
        "color": "#6C5CE7",
        "icon": "book",
    },
    {
        "name": "Home",
        "description": "Home and household expenses",
        "color": "#A29BFE",
        "icon": "home",
    },
    {
        "name": "Clothing",
        "description": "Clothing and fashion expenses",
        "color": "#FD79A8",
        "icon": "shirt",
    },
    {
        "name": "Technology",
        "description": "Technology and gadgets",
        "color": "#74B9FF",
        "icon": "laptop",
    },
    {
        "name": "Fitness",
        "description": "Fitness and sports activities",
        "color": "#00B894",
        "icon": "dumbbell",
    },
    {
        "name": "Travel",
        "description": "Travel and vacation expenses",
        "color": "#FDCB6E",
        "icon": "plane",
    },
    {
        "name": "Gifts",
        "description": "Gifts and donations",
        "color": "#E17055",
        "icon": "gift",
    },
    {
        "name": "Pets",
        "description": "Pet care and expenses",
        "color": "#81ECEC",
        "icon": "heart",
    },
    {
        "name": "Other",
        "description": "Other miscellaneous expenses",
        "color": "#636E72",
        "icon": "more-horizontal",
    },
]

# File paths for LLM integration
CATEGORIES_FILE_PATH = "data/categories.txt"
