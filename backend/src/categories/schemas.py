"""
Category Pydantic schemas for request/response validation.

This module defines the data models used for API requests and responses
for category management.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema with common fields."""

    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: str | None = Field(None, description="Category description")
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Hex color code")
    icon: str | None = Field(None, max_length=50, description="Icon name")


class CategoryCreate(CategoryBase):
    """Schema for creating a new category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""

    name: str | None = Field(None, min_length=1, max_length=100, description="Category name")
    description: str | None = Field(None, description="Category description")
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Hex color code")
    icon: str | None = Field(None, max_length=50, description="Icon name")
    is_active: bool | None = Field(None, description="Whether category is active")


class Category(CategoryBase):
    """Complete category schema with all fields."""

    id: int = Field(..., description="Category ID")
    is_default: bool = Field(..., description="Whether this is a default category")
    is_active: bool = Field(..., description="Whether category is active")
    user_id: int | None = Field(None, description="User ID (null for default categories)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """Response schema for category list endpoints."""

    categories: list[Category] = Field(..., description="List of categories")
    total: int = Field(..., description="Total number of categories")


class CategoryStats(BaseModel):
    """Category usage statistics."""

    category_id: int = Field(..., description="Category ID")
    category_name: str = Field(..., description="Category name")
    expense_count: int = Field(..., description="Number of expenses in this category")
    total_amount: float = Field(..., description="Total amount spent in this category")


class CategoryStatsResponse(BaseModel):
    """Response schema for category statistics."""

    stats: list[CategoryStats] = Field(..., description="Category statistics")
    total_categories: int = Field(..., description="Total number of categories with expenses")
