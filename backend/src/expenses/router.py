from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.auth.dependencies import CurrentUser
from src.categories.dependencies import get_preference_service
from src.categories.preference_service import CategoryPreferenceService
from src.database import DbSession
from src.expenses.repository import ExpenseRepository
from src.expenses.schemas import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from src.shared.constants import ExpenseCategory
from src.shared.exceptions import NotFoundError
from src.shared.schemas import PaginatedResponse, PaginationQuery

router = APIRouter()


def get_expense_repository(db: DbSession) -> ExpenseRepository:
    return ExpenseRepository(db)


@router.post("", status_code=201)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: CurrentUser,
    repository: Annotated[ExpenseRepository, Depends(get_expense_repository)],
) -> ExpenseResponse:
    """Create a new expense."""
    expense = await repository.create(expense_data, current_user.id)
    return ExpenseResponse.model_validate(expense)


@router.get("")
async def get_expenses(
    pagination: Annotated[PaginationQuery, Depends()],
    current_user: CurrentUser,
    repository: Annotated[ExpenseRepository, Depends(get_expense_repository)],
    start_date: datetime | None = Query(None, description="Filter expenses from this date"),
    end_date: datetime | None = Query(None, description="Filter expenses until this date"),
    category: ExpenseCategory | None = Query(None, description="Filter by expense category"),
) -> PaginatedResponse[ExpenseResponse]:
    """Get paginated expenses for the current user."""
    expenses, total = await repository.get_paginated_by_user(
        user_id=current_user.id,
        offset=pagination.offset,
        limit=pagination.limit,
        start_date=start_date,
        end_date=end_date,
        category=category,
    )
    expense_responses = [ExpenseResponse.model_validate(e) for e in expenses]
    return PaginatedResponse.create(
        items=expense_responses,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/{expense_id}")
async def get_expense(
    expense_id: int,
    current_user: CurrentUser,
    repository: Annotated[ExpenseRepository, Depends(get_expense_repository)],
) -> ExpenseResponse:
    """Get a specific expense."""
    expense = await repository.get_by_id(expense_id, current_user.id)
    if not expense:
        raise NotFoundError("Expense", expense_id)
    return ExpenseResponse.model_validate(expense)


@router.patch("/{expense_id}")
async def update_expense(
    expense_id: int,
    update_data: ExpenseUpdate,
    current_user: CurrentUser,
    repository: Annotated[ExpenseRepository, Depends(get_expense_repository)],
    preference_service: Annotated[
        CategoryPreferenceService, Depends(get_preference_service)
    ],
) -> dict:
    """Update an expense.

    If the category is changed, we learn this as a user preference for future
    AI classifications.
    """
    expense = await repository.get_by_id(expense_id, current_user.id)
    if not expense:
        raise NotFoundError("Expense", expense_id)

    # Detect category correction and learn from it
    if update_data.category and update_data.category != expense.category:
        await preference_service.learn_from_correction(
            user_id=current_user.id,
            item_name=expense.description,
            corrected_category=update_data.category,
            store_name=expense.store_name,
            original_category=expense.category,
            source_expense_id=expense_id,
        )

    expense = await repository.update(expense, update_data)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: int,
    current_user: CurrentUser,
    repository: Annotated[ExpenseRepository, Depends(get_expense_repository)],
) -> None:
    """Delete an expense."""
    expense = await repository.get_by_id(expense_id, current_user.id)
    if not expense:
        raise NotFoundError("Expense", expense_id)
    await repository.delete(expense)
