"""
Financial calculation utilities.

This module contains utility functions for financial calculations
and data preparation for charts and summaries.
"""


from src.expenses.schemas import Expense


def calculate_total_income(expenses: list[Expense]) -> float:
    """Calculate total income from expenses list."""
    return sum(expense.amount for expense in expenses if expense.type == "income")


def calculate_total_expenses(expenses: list[Expense]) -> float:
    """Calculate total expenses from expenses list."""
    return sum(expense.amount for expense in expenses if expense.type == "expense")


def calculate_net_amount(expenses: list[Expense]) -> float:
    """Calculate net amount (income - expenses)."""
    total_income = calculate_total_income(expenses)
    total_expenses = calculate_total_expenses(expenses)
    return total_income - total_expenses


def prepare_category_data(
    expenses: list[Expense], categories: dict[str, str]
) -> list[dict]:
    """Prepare category data for charts."""
    category_totals = {}

    # Calculate totals by category
    for expense in expenses:
        if expense.type == "expense":
            if expense.category not in category_totals:
                category_totals[expense.category] = 0
            category_totals[expense.category] += expense.amount

    # Convert to dict objects for API response
    category_data = []
    for category_name, total in category_totals.items():
        if total > 0:
            color = categories.get(category_name, "#6B7280")  # Default gray color
            category_data.append({
                "name": category_name,
                "value": total,
                "color": color
            })

    return category_data


def prepare_monthly_data(expenses: list[Expense]) -> list[dict]:
    """Prepare monthly data for charts."""
    total_income = calculate_total_income(expenses)
    total_expenses = calculate_total_expenses(expenses)

    # For now, return sample data with current month
    # TODO: Implement proper monthly aggregation
    return [
        {"month": "Jun", "income": 3200, "expenses": 1850},
        {"month": "Jul", "income": total_income, "expenses": total_expenses},
    ]


def calculate_category_spending(expenses: list[Expense]) -> dict[str, float]:
    """Calculate spending by category."""
    category_spending = {}

    for expense in expenses:
        if expense.type == "expense":
            if expense.category not in category_spending:
                category_spending[expense.category] = 0
            category_spending[expense.category] += expense.amount

    return category_spending


def calculate_budget_utilization(spent: float, limit: float) -> float:
    """Calculate budget utilization percentage."""
    if limit <= 0:
        return 0.0
    return min((spent / limit) * 100, 100.0)


def calculate_budget_remaining(spent: float, limit: float) -> float:
    """Calculate remaining budget amount."""
    return max(limit - spent, 0.0)


def is_budget_exceeded(spent: float, limit: float) -> bool:
    """Check if budget has been exceeded."""
    return spent > limit


def calculate_total_budget_spent(budgets: dict[str, dict]) -> float:
    """Calculate total amount spent across all budgets."""
    return sum(budget.get("spent", 0.0) for budget in budgets.values())


def calculate_total_budget_limit(budgets: dict[str, dict]) -> float:
    """Calculate total budget limit across all budgets."""
    return sum(budget.get("limit", 0.0) for budget in budgets.values())
