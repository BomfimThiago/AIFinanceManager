from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.auth.dependencies import CurrentUser
from src.categories.dependencies import get_category_service
from src.categories.schemas import CategoryCreate, CategoryResponse, CategoryUpdate
from src.categories.service import CategoryService
from src.shared.constants import CategoryType

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
async def get_categories(
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
    type: CategoryType | None = Query(None, description="Filter by category type"),
    include_hidden: bool = Query(False, description="Include hidden categories"),
) -> list[CategoryResponse]:
    """Get all categories for the current user."""
    categories = await service.get_all_categories(
        current_user.id,
        category_type=type,
        include_hidden=include_hidden,
    )
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    category_data: CategoryCreate,
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> CategoryResponse:
    """Create a new custom category."""
    category = await service.create_category(category_data, current_user.id)
    return CategoryResponse.model_validate(category)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> CategoryResponse:
    """Get a specific category."""
    category = await service.get_category(category_id, current_user.id)
    return CategoryResponse.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    update_data: CategoryUpdate,
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> CategoryResponse:
    """Update a category. Default categories can only be hidden."""
    category = await service.update_category(category_id, current_user.id, update_data)
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> None:
    """Delete a custom category. Default categories cannot be deleted."""
    await service.delete_category(category_id, current_user.id)


@router.post("/{category_id}/hide", response_model=CategoryResponse)
async def hide_category(
    category_id: int,
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> CategoryResponse:
    """Hide a category."""
    category = await service.hide_category(category_id, current_user.id)
    return CategoryResponse.model_validate(category)


@router.post("/{category_id}/unhide", response_model=CategoryResponse)
async def unhide_category(
    category_id: int,
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> CategoryResponse:
    """Unhide a category."""
    category = await service.unhide_category(category_id, current_user.id)
    return CategoryResponse.model_validate(category)


@router.post("/initialize", response_model=list[CategoryResponse])
async def initialize_categories(
    current_user: CurrentUser,
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> list[CategoryResponse]:
    """Initialize default categories for the current user."""
    categories = await service.initialize_user_categories(current_user.id)
    return [CategoryResponse.model_validate(c) for c in categories]
