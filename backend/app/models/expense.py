from typing import Optional, List, Literal
from pydantic import BaseModel
from datetime import datetime


class ExpenseBase(BaseModel):
    date: str
    amount: float
    category: str
    description: str
    merchant: str
    type: Literal["expense", "income"]
    source: Optional[Literal["ai-processed", "manual"]] = "manual"
    items: Optional[List[str]] = None


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: int

    class Config:
        from_attributes = True


class Budget(BaseModel):
    limit: float
    spent: float


class BudgetCreate(BaseModel):
    category: str
    limit: float


class AIInsight(BaseModel):
    title: str
    message: str
    type: Literal["warning", "success", "info"]
    actionable: Optional[str] = None


class CategoryData(BaseModel):
    name: str
    value: float
    color: str


class MonthlyData(BaseModel):
    month: str
    income: float
    expenses: float