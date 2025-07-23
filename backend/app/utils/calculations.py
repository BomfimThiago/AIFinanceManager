from typing import List, Dict
from app.models.expense import Expense, CategoryData, MonthlyData


def calculate_total_income(expenses: List[Expense]) -> float:
    """Calculate total income from expenses list."""
    return sum(expense.amount for expense in expenses if expense.type == 'income')


def calculate_total_expenses(expenses: List[Expense]) -> float:
    """Calculate total expenses from expenses list."""
    return sum(expense.amount for expense in expenses if expense.type == 'expense')


def calculate_net_amount(expenses: List[Expense]) -> float:
    """Calculate net amount (income - expenses)."""
    total_income = calculate_total_income(expenses)
    total_expenses = calculate_total_expenses(expenses)
    return total_income - total_expenses


def prepare_category_data(expenses: List[Expense], categories: Dict[str, str]) -> List[CategoryData]:
    """Prepare category data for charts."""
    category_totals = {}
    
    # Calculate totals by category
    for expense in expenses:
        if expense.type == 'expense':
            if expense.category not in category_totals:
                category_totals[expense.category] = 0
            category_totals[expense.category] += expense.amount
    
    # Convert to CategoryData objects
    category_data = []
    for category_name, total in category_totals.items():
        if total > 0:
            color = categories.get(category_name, "#6B7280")  # Default gray color
            category_data.append(CategoryData(
                name=category_name,
                value=total,
                color=color
            ))
    
    return category_data


def prepare_monthly_data(expenses: List[Expense]) -> List[MonthlyData]:
    """Prepare monthly data for charts."""
    total_income = calculate_total_income(expenses)
    total_expenses = calculate_total_expenses(expenses)
    
    # For now, return sample data with current month
    return [
        MonthlyData(month="Jun", income=3200, expenses=1850),
        MonthlyData(month="Jul", income=total_income, expenses=total_expenses)
    ]


def calculate_category_spending(expenses: List[Expense]) -> Dict[str, float]:
    """Calculate spending by category."""
    category_spending = {}
    
    for expense in expenses:
        if expense.type == 'expense':
            if expense.category not in category_spending:
                category_spending[expense.category] = 0
            category_spending[expense.category] += expense.amount
    
    return category_spending