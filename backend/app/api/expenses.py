from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, HTTPException
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

router = APIRouter()

# In-memory storage (in production, use a database)
expenses_db: List[Expense] = []
budgets_db: Dict[str, Dict[str, float]] = {}
next_id = 1

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


@router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    """Get all expenses."""
    return expenses_db


@router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    """Create a new expense."""
    global next_id
    new_expense = Expense(id=next_id, **expense.dict())
    expenses_db.append(new_expense)
    next_id += 1
    return new_expense


@router.post("/expenses/upload", response_model=Expense)
async def upload_expense_file(file: UploadFile = File(...)):
    """Upload and process file with AI to extract expense data."""
    if not file.content_type or not file.content_type.startswith(('image/', 'application/pdf')):
        raise HTTPException(status_code=400, detail="Only image and PDF files are supported")
    
    try:
        file_content = await file.read()
        expense = await ai_service.process_file_with_ai(file_content, file.content_type)
        
        if not expense:
            raise HTTPException(status_code=400, detail="Failed to process file")
        
        global next_id
        expense.id = next_id
        expenses_db.append(expense)
        next_id += 1
        
        return expense
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/expenses/summary")
async def get_expenses_summary():
    """Get expense summary data."""
    total_income = calculate_total_income(expenses_db)
    total_expenses = calculate_total_expenses(expenses_db)
    net_amount = calculate_net_amount(expenses_db)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_amount": net_amount,
        "category_spending": calculate_category_spending(expenses_db)
    }


@router.get("/expenses/charts/categories", response_model=List[CategoryData])
async def get_category_chart_data():
    """Get category data for pie chart."""
    return prepare_category_data(expenses_db, CATEGORIES)


@router.get("/expenses/charts/monthly", response_model=List[MonthlyData])
async def get_monthly_chart_data():
    """Get monthly data for line chart."""
    return prepare_monthly_data(expenses_db)


@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: int):
    """Delete an expense."""
    global expenses_db
    expenses_db = [e for e in expenses_db if e.id != expense_id]
    return {"message": "Expense deleted successfully"}