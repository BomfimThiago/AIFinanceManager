"""
Database seeding script for development and testing.
Run this to populate the database with sample data.
"""

import asyncio
from typing import List
from datetime import datetime, timedelta
import random

from .connection import AsyncSessionLocal
from .repositories import ExpenseRepository, BudgetRepository
from ..models.expense import ExpenseCreate, BudgetCreate


# Sample expense data for development
SAMPLE_EXPENSES = [
    {
        "date": "2024-01-15",
        "amount": 85.50,
        "category": "Groceries",
        "description": "Weekly grocery shopping",
        "merchant": "Whole Foods Market",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-16",
        "amount": 120.00,
        "category": "Utilities",
        "description": "Monthly electricity bill",
        "merchant": "Pacific Gas & Electric",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-17",
        "amount": 3500.00,
        "category": "Other",
        "description": "Monthly salary",
        "merchant": "Tech Company Inc",
        "type": "income",
        "source": "manual"
    },
    {
        "date": "2024-01-18",
        "amount": 45.75,
        "category": "Dining",
        "description": "Lunch at Italian restaurant",
        "merchant": "Mario's Bistro",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-19",
        "amount": 25.00,
        "category": "Transport",
        "description": "Uber ride to airport",
        "merchant": "Uber",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-20",
        "amount": 67.80,
        "category": "Entertainment",
        "description": "Movie tickets and popcorn",
        "merchant": "AMC Theaters",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-21",
        "amount": 150.00,
        "category": "Healthcare",
        "description": "Doctor visit co-pay",
        "merchant": "Medical Center",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-22",
        "amount": 92.30,
        "category": "Groceries",
        "description": "Organic vegetables and fruits",
        "merchant": "Farmer's Market",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-23",
        "amount": 35.60,
        "category": "Transport",
        "description": "Gas station fill-up",
        "merchant": "Shell",
        "type": "expense",
        "source": "manual"
    },
    {
        "date": "2024-01-24",
        "amount": 89.99,
        "category": "Entertainment",
        "description": "Streaming service subscription",
        "merchant": "Netflix",
        "type": "expense",
        "source": "manual"
    }
]

# Sample budget data
SAMPLE_BUDGETS = [
    {"category": "Groceries", "limit": 400.00},
    {"category": "Dining", "limit": 200.00},
    {"category": "Transport", "limit": 150.00},
    {"category": "Entertainment", "limit": 100.00},
    {"category": "Utilities", "limit": 200.00},
    {"category": "Healthcare", "limit": 300.00},
    {"category": "Other", "limit": 500.00}
]


async def seed_expenses(session) -> List:
    """Seed the database with sample expenses."""
    expense_repo = ExpenseRepository(session)
    created_expenses = []
    
    print("🌱 Seeding expenses...")
    for expense_data in SAMPLE_EXPENSES:
        expense_create = ExpenseCreate(**expense_data)
        expense = await expense_repo.create(expense_create)
        created_expenses.append(expense)
        print(f"   ✓ Created expense: {expense.description} - ${expense.amount}")
    
    return created_expenses


async def seed_budgets(session) -> List:
    """Seed the database with sample budgets."""
    budget_repo = BudgetRepository(session)
    created_budgets = []
    
    print("💰 Seeding budgets...")
    for budget_data in SAMPLE_BUDGETS:
        budget_create = BudgetCreate(**budget_data)
        budget = await budget_repo.create_or_update(budget_create)
        created_budgets.append(budget)
        print(f"   ✓ Created budget: {budget.category} - ${budget.limit_amount}")
    
    return created_budgets


async def calculate_budget_spending(session):
    """Calculate and update budget spending based on expenses."""
    expense_repo = ExpenseRepository(session)
    budget_repo = BudgetRepository(session)
    
    print("📊 Calculating budget spending...")
    
    # Get all expenses
    expenses = await expense_repo.get_all()
    
    # Calculate spending by category
    category_spending = {}
    for expense in expenses:
        if expense.type.value == "expense":  # Only count expenses, not income
            category = expense.category
            if category not in category_spending:
                category_spending[category] = 0.0
            category_spending[category] += expense.amount
    
    # Update budget spending
    for category, spent_amount in category_spending.items():
        budget = await budget_repo.get_by_category(category)
        if budget:
            await budget_repo.update_spent_amount(category, spent_amount)
            print(f"   ✓ Updated {category}: ${spent_amount:.2f} spent of ${budget.limit_amount:.2f}")


async def seed_database():
    """Main seeding function."""
    print("🚀 Starting database seeding...")
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if database already has data
            expense_repo = ExpenseRepository(session)
            existing_expenses = await expense_repo.get_all()
            
            if existing_expenses:
                print("⚠️  Database already contains expenses. Skipping seeding.")
                print(f"   Found {len(existing_expenses)} existing expenses.")
                return
            
            # Seed data
            expenses = await seed_expenses(session)
            budgets = await seed_budgets(session)
            await calculate_budget_spending(session)
            
            print(f"✅ Database seeding completed successfully!")
            print(f"   Created {len(expenses)} expenses")
            print(f"   Created {len(budgets)} budgets")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


if __name__ == "__main__":
    asyncio.run(seed_database())