from enum import StrEnum


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
