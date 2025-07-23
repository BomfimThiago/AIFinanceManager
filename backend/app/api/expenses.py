from typing import List, Dict
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
from app.db.repositories import ExpenseRepository

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
    repo = ExpenseRepository(db)
    expense_model = await repo.create(expense)
    return expense_model_to_pydantic(expense_model)


@router.post("/expenses/upload", response_model=Expense)
async def upload_expense_file(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Upload and process file with AI to extract expense data."""
    if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
        raise HTTPException(status_code=400, detail="Only image and PDF files are supported")
    
    try:
        file_content = await file.read()
        expense = await ai_service.process_file_with_ai(file_content, file.content_type)
        
        if not expense:
            raise HTTPException(status_code=400, detail="Failed to process file")
        
        # Create expense in database
        repo = ExpenseRepository(db)
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
        expense_model = await repo.create(expense_create)
        
        return expense_model_to_pydantic(expense_model)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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