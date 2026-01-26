#!/usr/bin/env python3
"""
Script to delete all expenses and receipts for a specific user.
WARNING: This will permanently delete data!
"""

import asyncio
import sys
from pathlib import Path

# Add backend src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
# Import all models to resolve relationships
from src.auth.models import User
from src.categories.models import Category, UserCategoryPreference
from src.expenses.models import Expense
from src.receipts.models import Receipt


async def delete_all_user_data(user_id: int):
    """Delete all expenses and receipts for a specific user."""

    # Get database session
    async for db in get_db():
        try:
            # Delete all expenses for the user
            expense_result = await db.execute(
                delete(Expense).where(Expense.user_id == user_id)
            )
            expense_count = expense_result.rowcount

            # Delete all receipts for the user
            receipt_result = await db.execute(
                delete(Receipt).where(Receipt.user_id == user_id)
            )
            receipt_count = receipt_result.rowcount

            # Commit the transaction
            await db.commit()

            print(f"✅ Successfully deleted:")
            print(f"   - {expense_count} expenses")
            print(f"   - {receipt_count} receipts")

            return expense_count, receipt_count

        except Exception as e:
            await db.rollback()
            print(f"❌ Error deleting data: {e}")
            raise
        finally:
            await db.close()


async def main():
    """Main function to run the deletion."""

    # WARNING: Using user_id=1 as default
    USER_ID = 1

    print(f"🗑️  Deleting all expenses and receipts for user_id={USER_ID}...")
    await delete_all_user_data(USER_ID)
    print("✅ Deletion complete!")


if __name__ == "__main__":
    asyncio.run(main())