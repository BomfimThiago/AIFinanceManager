#!/usr/bin/env python3
"""Test script to verify budget creation and functionality."""

import asyncio
from src.database import get_database_session_context
from src.budgets.service import BudgetService
from src.budgets.repository import BudgetRepository
from src.budgets.schemas import BudgetCreate

async def test_budget_functionality():
    """Test budget creation and operations."""
    print("Testing budget functionality...")
    
    async with get_database_session_context() as session:
        # Create service
        repository = BudgetRepository(session)
        service = BudgetService(repository)
        
        # Create test budget
        budget_data = BudgetCreate(
            category="Groceries",
            limit=500.0
        )
        
        print(f"Creating budget: {budget_data.category} with limit ${budget_data.limit}")
        
        # Create budget
        created_budget = await service.create_or_update(budget_data)
        
        print(f"✅ Created budget ID: {created_budget.id}")
        print(f"   Category: {created_budget.category}")
        print(f"   Limit: ${created_budget.limit}")
        print(f"   Spent: ${created_budget.spent}")
        
        # Test getting all budgets
        all_budgets = await service.get_all()
        print(f"\n📊 All budgets: {len(all_budgets)} found")
        for category, budget in all_budgets.items():
            print(f"   - {category}: ${budget.spent}/${budget.limit}")
        
        # Test updating spent amount
        print(f"\n💰 Updating spent amount for {created_budget.category}")
        updated_budget = await service.update_spent_amount("Groceries", 150.0)
        if updated_budget:
            print(f"   New spent amount: ${updated_budget.spent}")

if __name__ == "__main__":
    asyncio.run(test_budget_functionality())