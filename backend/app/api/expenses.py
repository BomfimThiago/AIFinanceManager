from typing import List, Dict
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense, ExpenseCreate, AIInsight, CategoryData, MonthlyData
from app.services.ai_service import ai_service
from app.utils.calculations import (
    calculate_total_income, 
    calculate_total_expenses, 
    calculate_net_amount,
    prepare_category_data,
    prepare_monthly_data,
    calculate_category_spending
)
from app.db.connection import get_db
from app.db.repositories import ExpenseRepository, UploadHistoryRepository
from app.db.models import UploadStatus
from app.api.auth import get_current_user
from app.models.auth import User

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
    "Other": "#6B7280"
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
        items=expense_model.items
    )


@router.get("/expenses", response_model=List[Expense])
async def get_expenses(db: AsyncSession = Depends(get_db)):
    """Get all expenses."""
    repo = ExpenseRepository(db)
    expense_models = await repo.get_all()
    return [expense_model_to_pydantic(expense) for expense in expense_models]


@router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Create a new expense."""
    try:
        logger.info(f"Creating expense with data: {expense.dict()}")
        repo = ExpenseRepository(db)
        expense_model = await repo.create(expense)
        return expense_model_to_pydantic(expense_model)
    except Exception as e:
        logger.error(f"Error creating manual expense: {e}")
        logger.error(f"Expense data: {expense.dict() if hasattr(expense, 'dict') else 'Invalid data'}")
        raise HTTPException(status_code=500, detail=f"Failed to create expense: {str(e)}")


@router.post("/expenses/bulk", response_model=List[Expense])
async def create_bulk_expenses(expenses: List[ExpenseCreate], db: AsyncSession = Depends(get_db)):
    """Create multiple expenses in a single request."""
    repo = ExpenseRepository(db)
    created_expenses = []
    
    for expense_data in expenses:
        try:
            expense_model = await repo.create(expense_data)
            created_expenses.append(expense_model_to_pydantic(expense_model))
        except Exception as e:
            logger.error(f"Failed to create one of the bulk expenses: {expense_data.description}")
            # Optionally, decide if you want to stop or continue on error
            continue
            
    if not created_expenses:
        raise HTTPException(status_code=400, detail="No valid expenses were created.")
        
    return created_expenses


@router.post("/expenses/upload", response_model=List[Expense])
async def upload_expenses_from_file(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and process file with AI to extract expense data."""
    if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
        raise HTTPException(status_code=400, detail="Only image and PDF files are supported")
    
    # Create upload history record
    upload_repo = UploadHistoryRepository(db)
    file_content = await file.read()
    file_size = len(file_content)
    
    upload_record = await upload_repo.create(
        user_id=current_user.id,
        filename=file.filename or "unknown",
        file_size=file_size,
        status=UploadStatus.PROCESSING
    )
    
    try:
        expenses = await ai_service.process_file_with_ai(file_content, file.content_type)
        
        if not expenses or len(expenses) == 0:
            # Update upload history to failed
            await upload_repo.update_status(
                upload_record.id, 
                UploadStatus.FAILED, 
                "No expense data found in the file"
            )
            raise HTTPException(status_code=400, detail="Failed to process file - no expense data found")
        
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
                items=expense.items
            )
            expense_model = await expense_repo.create(expense_create)
            created_expenses.append(expense_model_to_pydantic(expense_model))
        
        # Update upload history to success
        await upload_repo.update_status(upload_record.id, UploadStatus.SUCCESS)
        
        return created_expenses
        
    except HTTPException as e:
        # Update upload history to failed
        await upload_repo.update_status(
            upload_record.id, 
            UploadStatus.FAILED, 
            str(e.detail)
        )
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"File upload error: {e}\n{error_details}")
        
        # Update upload history to failed
        await upload_repo.update_status(
            upload_record.id, 
            UploadStatus.FAILED, 
            f"Internal server error: {str(e)}"
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
        "category_spending": calculate_category_spending(expenses)
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


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an expense."""
    repo = ExpenseRepository(db)
    success = await repo.delete(expense_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense deleted successfully"}