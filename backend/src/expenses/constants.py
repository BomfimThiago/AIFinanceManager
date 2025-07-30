"""
Expense module constants.

This module contains constants specific to the expenses functionality.
"""

from src.shared.constants import Currency

# Expense categories with UI colors (must match frontend)
EXPENSE_CATEGORIES = {
    "Groceries": "#10B981",
    "Utilities": "#3B82F6",
    "Transport": "#F59E0B",
    "Dining": "#EF4444",
    "Entertainment": "#8B5CF6",
    "Healthcare": "#06B6D4",
    "Other": "#6B7280",
}

# Default currency for expenses
DEFAULT_CURRENCY = Currency.EUR

# File upload settings
SUPPORTED_FILE_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]

MAX_FILE_SIZE_MB = 50
