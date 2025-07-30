"""
Category API endpoints.

This module contains the FastAPI router for category management operations.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.categories.dependencies import get_current_user_category_service
from src.categories.schemas import (
    Category,
    CategoryCreate,
    CategoryListResponse,
    CategoryStatsResponse,
    CategoryUpdate,
)
from src.categories.service import CategoryService

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/", response_model=CategoryListResponse)
async def get_categories(
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)],
    include_default: bool = True
) -> CategoryListResponse:
    """Get all categories available to the current user."""
    user_id, service = user_service

    categories = await service.get_user_categories(user_id, include_default)

    return CategoryListResponse(
        categories=[Category.model_validate(cat) for cat in categories],
        total=len(categories)
    )


@router.post("/", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)]
) -> Category:
    """Create a new custom category for the current user."""
    user_id, service = user_service

    try:
        category = await service.create_user_category(user_id, category_data)
        return Category.model_validate(category)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: int,
    update_data: CategoryUpdate,
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)]
) -> Category:
    """Update a custom category owned by the current user."""
    user_id, service = user_service

    try:
        category = await service.update_category(category_id, user_id, update_data)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found or cannot be updated"
            )
        return Category.model_validate(category)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) from e


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)]
) -> None:
    """Delete (deactivate) a custom category owned by the current user."""
    user_id, service = user_service

    success = await service.delete_category(category_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or cannot be deleted"
        )


@router.get("/stats", response_model=CategoryStatsResponse)
async def get_category_stats(
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)]
) -> CategoryStatsResponse:
    """Get category usage statistics for the current user."""
    user_id, service = user_service

    stats = await service.get_category_stats(user_id)

    return CategoryStatsResponse(
        stats=stats,
        total_categories=len(stats)
    )


@router.get("/names", response_model=list[str])
async def get_category_names(
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)]
) -> list[str]:
    """Get category names for the current user (for LLM processing)."""
    user_id, service = user_service

    return await service.get_category_names_for_llm(user_id)


@router.post("/preferences/{account_name}/{category_name}", status_code=status.HTTP_201_CREATED)
async def add_category_preference(
    account_name: str,
    category_name: str,
    user_service: Annotated[tuple[int, CategoryService], Depends(get_current_user_category_service)]
) -> dict[str, str]:
    """Add a category preference for a specific account/merchant."""
    user_id, service = user_service

    await service.add_user_category_preference(user_id, account_name, category_name)

    return {
        "message": f"Category preference added: {account_name} -> {category_name}",
        "account_name": account_name,
        "category_name": category_name
    }
