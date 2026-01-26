from enum import StrEnum


class CategoryType(StrEnum):
    EXPENSE = "expense"
    INCOME = "income"


# Deprecated: Use Category model instead. Kept for AI parser backward compatibility.
class ExpenseCategory(StrEnum):
    GROCERIES = "groceries"
    DINING = "dining"
    TRANSPORTATION = "transportation"
    UTILITIES = "utilities"
    ENTERTAINMENT = "entertainment"
    HEALTHCARE = "healthcare"
    SHOPPING = "shopping"
    HOUSING = "housing"
    EDUCATION = "education"
    TRAVEL = "travel"
    RENT = "rent"
    ENERGY = "energy"
    INTERNET = "internet"
    INSURANCE = "insurance"
    SUBSCRIPTIONS = "subscriptions"
    OTHER_EXPENSE = "other_expense"
    OTHER = "other"


class Currency(StrEnum):
    USD = "USD"
    EUR = "EUR"
    BRL = "BRL"
    GBP = "GBP"


class ReceiptStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
