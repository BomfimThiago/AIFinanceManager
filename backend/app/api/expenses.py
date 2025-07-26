import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.connection import get_db
from app.db.models import UploadStatus
from app.db.repositories import ExpenseRepository, UploadHistoryRepository
from app.models.auth import User
from app.models.expense import (
    AIInsight,
    CategoryData,
    Expense,
    ExpenseCreate,
    MonthlyData,
)
from app.services.ai_service import ai_service
from app.services.currency_service import Currency, currency_service
from app.utils.calculations import (
    calculate_category_spending,
    calculate_net_amount,
    calculate_total_expenses,
    calculate_total_income,
    prepare_category_data,
    prepare_monthly_data,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Categories with colors (should match frontend)
CATEGORIES = {
    "Groceries": "#10B981",
    "Utilities": "#3B82F6",
    "Transport": "#F59E0B",
    "Dining": "#EF4444",
    "Entertainment": "#8B5CF6",
    "Healthcare": "#06B6D4",
    "Other": "#6B7280",
}


def expense_model_to_pydantic(expense_model) -> Expense:
    """Convert SQLAlchemy model to Pydantic model."""
    return Expense(
        id=expense_model.id,
        date=expense_model.date,
        amount=expense_model.amount,
        category=expense_model.category,
        description=expense_model.description,
        merchant=expense_model.merchant,
        type=expense_model.type.value,
        source=expense_model.source.value if expense_model.source else "manual",
        items=expense_model.items,
        # Multi-currency fields
        original_currency=expense_model.original_currency,
        amounts=expense_model.amounts,
        exchange_rates=expense_model.exchange_rates,
        exchange_date=expense_model.exchange_date,
    )


@router.get("/expenses", response_model=List[Expense])
async def get_expenses(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get expenses with optional month and year filtering."""
    repo = ExpenseRepository(db)

    if month is not None or year is not None:
        expense_models = await repo.get_by_date_filter(month=month, year=year)
    else:
        expense_models = await repo.get_all()

    return [expense_model_to_pydantic(expense) for expense in expense_models]


@router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new expense."""
    try:
        logger.info(f"Creating expense with data: {expense.model_dump()}")

        # Handle multi-currency conversion
        expense_with_currencies = await _process_expense_currencies(expense)

        repo = ExpenseRepository(db)
        expense_model = await repo.create(expense_with_currencies)
        return expense_model_to_pydantic(expense_model)
    except Exception as e:
        logger.error(f"Error creating manual expense: {e}")
        logger.error(
            f"Expense data: {expense.model_dump() if hasattr(expense, 'model_dump') else 'Invalid data'}"
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to create expense: {str(e)}"
        )


@router.post("/expenses/bulk", response_model=List[Expense])
async def create_bulk_expenses(
    expenses: List[ExpenseCreate], db: AsyncSession = Depends(get_db)
):
    """Create multiple expenses in a single request."""
    repo = ExpenseRepository(db)
    created_expenses = []

    for expense_data in expenses:
        try:
            # Process with currency conversion like single expense creation
            expense_with_currencies = await _process_expense_currencies(expense_data)
            expense_model = await repo.create(expense_with_currencies)
            created_expenses.append(expense_model_to_pydantic(expense_model))
        except Exception:
            logger.error(
                f"Failed to create one of the bulk expenses: {expense_data.description}"
            )
            # Optionally, decide if you want to stop or continue on error
            continue

    if not created_expenses:
        raise HTTPException(status_code=400, detail="No valid expenses were created.")

    return created_expenses


@router.post("/expenses/upload", response_model=List[Expense])
async def upload_expenses_from_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and process file with AI to extract expense data."""
    if not file.content_type or not file.content_type.startswith(
        ('image/', 'application/pdf')
    ):
        raise HTTPException(
            status_code=400, detail="Only image and PDF files are supported"
        )

    # Create upload history record
    upload_repo = UploadHistoryRepository(db)
    file_content = await file.read()
    file_size = len(file_content)

    upload_record = await upload_repo.create(
        user_id=current_user.id,
        filename=file.filename or "unknown",
        file_size=file_size,
        status=UploadStatus.PROCESSING,
    )

    try:
        expenses = await ai_service.process_file_with_ai(
            file_content, file.content_type
        )

        if not expenses or len(expenses) == 0:
            # Update upload history to failed
            await upload_repo.update_status(
                upload_record.id,
                UploadStatus.FAILED,
                "No expense data found in the file",
            )
            raise HTTPException(
                status_code=400, detail="Failed to process file - no expense data found"
            )

        # Create expenses in database
        expense_repo = ExpenseRepository(db)
        created_expenses = []

        for expense in expenses:
            expense_create = ExpenseCreate(
                date=expense.date,
                amount=expense.amount,
                category=expense.category,
                description=expense.description,
                merchant=expense.merchant,
                type=expense.type,
                source=expense.source,
                items=expense.items,
                original_currency=expense.original_currency,
            )
            # Process with currency conversion
            expense_with_currencies = await _process_expense_currencies(expense_create)
            expense_model = await expense_repo.create(expense_with_currencies)
            created_expenses.append(expense_model_to_pydantic(expense_model))

        # Update upload history to success
        await upload_repo.update_status(upload_record.id, UploadStatus.SUCCESS)

        return created_expenses

    except HTTPException as e:
        # Update upload history to failed
        await upload_repo.update_status(
            upload_record.id, UploadStatus.FAILED, str(e.detail)
        )
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        import traceback

        error_details = traceback.format_exc()
        logger.error(f"File upload error: {e}\n{error_details}")

        # Update upload history to failed
        await upload_repo.update_status(
            upload_record.id, UploadStatus.FAILED, f"Internal server error: {str(e)}"
        )

        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/expenses/summary")
async def get_expenses_summary(db: AsyncSession = Depends(get_db)):
    """Get expense summary data."""
    repo = ExpenseRepository(db)
    expense_models = await repo.get_all()
    expenses = [expense_model_to_pydantic(expense) for expense in expense_models]

    total_income = calculate_total_income(expenses)
    total_expenses = calculate_total_expenses(expenses)
    net_amount = calculate_net_amount(expenses)

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_amount": net_amount,
        "category_spending": calculate_category_spending(expenses),
    }


@router.get("/expenses/charts/categories", response_model=List[CategoryData])
async def get_category_chart_data(db: AsyncSession = Depends(get_db)):
    """Get category data for pie chart."""
    repo = ExpenseRepository(db)
    expense_models = await repo.get_all()
    expenses = [expense_model_to_pydantic(expense) for expense in expense_models]
    return prepare_category_data(expenses, CATEGORIES)


@router.get("/expenses/charts/monthly", response_model=List[MonthlyData])
async def get_monthly_chart_data(db: AsyncSession = Depends(get_db)):
    """Get monthly data for line chart."""
    repo = ExpenseRepository(db)
    expense_models = await repo.get_all()
    expenses = [expense_model_to_pydantic(expense) for expense in expense_models]
    return prepare_monthly_data(expenses)


@router.get("/expenses/category-spending")
async def get_category_spending(
    currency: str = "EUR",
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get actual spending amounts by category with currency conversion."""
    repo = ExpenseRepository(db)

    # Get filtered expenses
    if month is not None or year is not None:
        expense_models = await repo.get_by_date_filter(month=month, year=year)
    else:
        expense_models = await repo.get_all()

    expenses = [expense_model_to_pydantic(expense) for expense in expense_models]

    # Calculate spending by category with currency conversion
    category_spending = {}
    target_currency = Currency(currency)

    for expense in expenses:
        if expense.type == 'expense':
            # Use pre-calculated amounts if available for the target currency
            if expense.amounts and target_currency.value in expense.amounts:
                amount = expense.amounts[target_currency.value]
            else:
                # Convert using current rates if no pre-calculated amount
                original_currency = Currency(expense.original_currency or "EUR")
                current_rates = await currency_service.get_current_rates()
                amount = await currency_service.convert_amount(
                    expense.amount, original_currency, target_currency, current_rates
                )

            if expense.category not in category_spending:
                category_spending[expense.category] = 0
            category_spending[expense.category] += amount

    return {"currency": currency, "category_spending": category_spending}


@router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: int, expense: ExpenseCreate, db: AsyncSession = Depends(get_db)
):
    """Update an expense."""
    try:
        logger.info(f"Updating expense {expense_id} with data: {expense.model_dump()}")

        # Handle multi-currency conversion
        expense_with_currencies = await _process_expense_currencies(expense)

        repo = ExpenseRepository(db)
        expense_model = await repo.update(expense_id, expense_with_currencies)

        if not expense_model:
            raise HTTPException(status_code=404, detail="Expense not found")

        return expense_model_to_pydantic(expense_model)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense: {e}")
        logger.error(
            f"Expense data: {expense.model_dump() if hasattr(expense, 'model_dump') else 'Invalid data'}"
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to update expense: {str(e)}"
        )


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an expense."""
    repo = ExpenseRepository(db)
    success = await repo.delete(expense_id)

    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {"message": "Expense deleted successfully"}


async def _process_expense_currencies(expense: ExpenseCreate) -> ExpenseCreate:
    """Process expense to include multi-currency data."""
    try:
        # Get the original currency (default to EUR if not specified)
        original_currency = Currency(expense.original_currency or "EUR")

        # Get current exchange rates
        exchange_rates = await currency_service.get_current_rates()

        # Convert the amount to all supported currencies
        amounts = await currency_service.convert_to_all_currencies(
            expense.amount, original_currency, exchange_rates
        )

        # Create updated expense with currency data
        expense_data = expense.model_dump()
        expense_data.update(
            {
                "original_currency": original_currency.value,
                "amounts": amounts,
                "exchange_rates": exchange_rates,
                "exchange_date": expense.date,  # Use expense date for historical accuracy
            }
        )

        return ExpenseCreate(**expense_data)

    except Exception as e:
        logger.error(f"Error processing expense currencies: {e}")
        # Return original expense if currency processing fails
        return expense


@router.get("/currencies")
async def get_currencies():
    """Get supported currencies with their display information."""
    return {
        "currencies": currency_service.get_all_currencies_info(),
        "supported": [currency.value for currency in Currency],
    }


@router.get("/exchange-rates")
async def get_current_exchange_rates():
    """Get current exchange rates for all supported currencies."""
    try:
        rates = await currency_service.get_current_rates()
        return {
            "rates": rates,
            "base_currency": "EUR",
            "timestamp": rates.get("date", "current"),
        }
    except Exception as e:
        logger.error(f"Error fetching exchange rates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exchange rates")
