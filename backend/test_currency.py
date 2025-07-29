#!/usr/bin/env python3
"""Test script to verify currency processing in expense creation."""

import asyncio
from src.database import get_database_session_context
from src.expenses.service import ExpenseService
from src.expenses.repository import ExpenseRepository
from src.expenses.schemas import ExpenseCreate

async def test_currency_processing():
    """Test expense creation with currency processing."""
    print("Testing expense currency processing...")
    
    async with get_database_session_context() as session:
        # Create service
        repository = ExpenseRepository(session)
        service = ExpenseService(repository)
        
        # Create test expense
        expense_data = ExpenseCreate(
            date="2025-07-29",
            amount=25.50,
            category="Dining",
            description="Test Pizza",
            merchant="Test Restaurant",
            type="expense",
            source="manual",
            items=[],
            original_currency="USD"
        )
        
        print(f"Creating expense: {expense_data.description}")
        print(f"Original amount: ${expense_data.amount} {expense_data.original_currency}")
        
        # Create expense (this should call _process_expense_currencies)
        created_expense = await service.create(expense_data)
        
        print(f"\nCreated expense ID: {created_expense.id}")
        print(f"Amounts: {created_expense.amounts}")
        print(f"Exchange rates: {created_expense.exchange_rates}")
        print(f"Exchange date: {created_expense.exchange_date}")
        
        # Verify currency processing worked
        if created_expense.amounts:
            print("\n✅ Currency processing SUCCESS!")
            for currency, amount in created_expense.amounts.items():
                print(f"  - {currency}: {amount:.2f}")
        else:
            print("\n❌ Currency processing FAILED - amounts is null")

if __name__ == "__main__":
    asyncio.run(test_currency_processing())