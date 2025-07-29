"""
Expense API router.

This module contains the FastAPI router for expense-related endpoints.
"""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from src.auth.dependencies import get_current_user
from src.auth.schemas import User
from src.expenses.constants import EXPENSE_CATEGORIES, SUPPORTED_FILE_TYPES
from src.expenses.dependencies import get_expense_service
from src.expenses.schemas import (
    CategoryData,
    CategorySpendingResponse,
    Expense,
    ExpenseCreate,
    ExpenseSummary,
    MonthlyData,
)
from src.expenses.service import ExpenseService
from src.services.ai_service import ai_service
from src.upload_history.dependencies import get_upload_history_service
from src.upload_history.schemas import UploadStatus
from src.upload_history.service import UploadHistoryService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("", response_model=list[Expense])
async def get_expenses(
    month: int | None = None,
    year: int | None = None,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    """Get expenses with optional month and year filtering."""
    return await expense_service.get_all(month=month, year=year)


@router.post("", response_model=Expense)
async def create_expense(
    expense: ExpenseCreate,
    expense_service: ExpenseService = Depends(get_expense_service),
    current_user: User = Depends(get_current_user),
):
    """Create a new expense."""
    try:
        logger.info(f"Creating expense for user {current_user.id}: {expense.model_dump()}")
        return await expense_service.create(expense)
    except Exception as e:
        logger.error(f"Error creating expense: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create expense: {e!s}",
        )


@router.post("/bulk", response_model=list[Expense])
async def create_bulk_expenses(
    expenses: list[ExpenseCreate],
    expense_service: ExpenseService = Depends(get_expense_service),
    current_user: User = Depends(get_current_user),
):
    """Create multiple expenses in a single request."""
    try:
        logger.info(f"Creating {len(expenses)} expenses for user {current_user.id}")
        created_expenses = await expense_service.create_bulk(expenses)

        if not created_expenses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid expenses were created",
            )

        return created_expenses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bulk expenses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create expenses: {e!s}",
        )


@router.post("/upload", response_model=list[Expense])
async def upload_expenses_from_file(
    file: UploadFile = File(...),
    expense_service: ExpenseService = Depends(get_expense_service),
    upload_service: UploadHistoryService = Depends(get_upload_history_service),
    current_user: User = Depends(get_current_user),
):
    """Upload and process file with AI to extract expense data."""
    # Validate file type
    if not file.content_type or file.content_type not in SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported types: {', '.join(SUPPORTED_FILE_TYPES)}",
        )

    # Read file content
    file_content = await file.read()
    file_size = len(file_content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )

    # Create upload history record
    upload_record = await upload_service.create_upload_record(
        user_id=current_user.id,
        filename=file.filename or "unknown",
        file_size=file_size,
        status=UploadStatus.PROCESSING,
    )

    try:
        # Process file with AI
        ai_expenses = await ai_service.process_file_with_ai(
            file_content, file.content_type
        )

        if not ai_expenses or len(ai_expenses) == 0:
            await upload_service.update_upload_status(
                upload_record.id,
                UploadStatus.FAILED,
                "No expense data found in the file",
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process file - no expense data found",
            )

        # Convert AI results to ExpenseCreate objects
        expense_creates = []
        for ai_expense in ai_expenses:
            expense_create = ExpenseCreate(
                date=ai_expense.date,
                amount=ai_expense.amount,
                category=ai_expense.category,
                description=ai_expense.description,
                merchant=ai_expense.merchant,
                type=ai_expense.type,
                source=ai_expense.source,
                items=ai_expense.items,
                original_currency=ai_expense.original_currency,
            )
            expense_creates.append(expense_create)

        # Create expenses in database
        created_expenses = await expense_service.create_bulk(expense_creates)

        # Update upload history to success
        await upload_service.update_upload_status(upload_record.id, UploadStatus.SUCCESS)

        return created_expenses

    except HTTPException:
        # Update upload history to failed
        await upload_service.update_upload_status(
            upload_record.id, UploadStatus.FAILED, "Processing failed"
        )
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        # Update upload history to failed
        await upload_service.update_upload_status(
            upload_record.id, UploadStatus.FAILED, f"Internal server error: {e!s}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {e!s}",
        )


@router.get("/summary", response_model=ExpenseSummary)
async def get_expenses_summary(
    expense_service: ExpenseService = Depends(get_expense_service),
):
    """Get expense summary data."""
    summary_data = await expense_service.get_summary()
    return ExpenseSummary(**summary_data)


@router.get("/charts/categories", response_model=list[CategoryData])
async def get_category_chart_data(
    expense_service: ExpenseService = Depends(get_expense_service),
):
    """Get category data for pie chart."""
    category_data = await expense_service.get_category_chart_data(EXPENSE_CATEGORIES)
    return [CategoryData(**data) for data in category_data]


@router.get("/charts/monthly", response_model=list[MonthlyData])
async def get_monthly_chart_data(
    expense_service: ExpenseService = Depends(get_expense_service),
):
    """Get monthly data for line chart."""
    monthly_data = await expense_service.get_monthly_chart_data()
    return [MonthlyData(**data) for data in monthly_data]


@router.get("/category-spending", response_model=CategorySpendingResponse)
async def get_category_spending(
    currency: str = "EUR",
    month: int | None = None,
    year: int | None = None,
    expense_service: ExpenseService = Depends(get_expense_service),
):
    """Get actual spending amounts by category with currency conversion."""
    spending_data = await expense_service.get_category_spending(
        currency=currency, month=month, year=year
    )
    return CategorySpendingResponse(**spending_data)


@router.put("/{expense_id}", response_model=Expense)
async def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    expense_service: ExpenseService = Depends(get_expense_service),
    current_user: User = Depends(get_current_user),
):
    """Update an expense."""
    try:
        logger.info(f"Updating expense {expense_id} for user {current_user.id}")

        # Convert ExpenseCreate to ExpenseUpdate (all fields optional in update)
        from src.expenses.schemas import ExpenseUpdate
        expense_update = ExpenseUpdate(
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

        updated_expense = await expense_service.update(expense_id, expense_update)

        if not updated_expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )

        return updated_expense
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating expense: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update expense: {e!s}",
        )


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: int,
    expense_service: ExpenseService = Depends(get_expense_service),
    current_user: User = Depends(get_current_user),
):
    """Delete an expense."""
    try:
        logger.info(f"Deleting expense {expense_id} for user {current_user.id}")
        success = await expense_service.delete(expense_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found",
            )

        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting expense: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete expense: {e!s}",
        )
