"""
Insight Pydantic schemas.

This module contains the Pydantic schemas for AI insights data validation.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.shared.constants import InsightType


class InsightBase(BaseModel):
    """Base insight schema with common fields."""

    title: str = Field(..., description="Insight title")
    message: str = Field(..., description="Insight message/description")
    type: InsightType = Field(..., description="Insight type")
    actionable: str | None = Field(None, description="Actionable advice")


class InsightCreate(InsightBase):
    """Schema for creating a new insight."""

    pass


class InsightUpdate(BaseModel):
    """Schema for updating an insight."""

    title: str | None = Field(None, description="Insight title")
    message: str | None = Field(None, description="Insight message/description")
    type: InsightType | None = Field(None, description="Insight type")
    actionable: str | None = Field(None, description="Actionable advice")


class Insight(InsightBase):
    """Schema for insight response."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Insight ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


# Legacy schema for compatibility with existing AI service
class AIInsight(BaseModel):
    """Legacy schema for AI insights (for compatibility)."""

    title: str = Field(..., description="Insight title")
    message: str = Field(..., description="Insight message/description")
    type: InsightType = Field(..., description="Insight type")
    actionable: str | None = Field(None, description="Actionable advice")


class InsightSummary(BaseModel):
    """Schema for insight summary."""

    total_insights: int = Field(..., description="Total number of insights")
    warning_count: int = Field(..., description="Number of warning insights")
    success_count: int = Field(..., description="Number of success insights")
    info_count: int = Field(..., description="Number of info insights")
    insights: list[Insight] = Field(..., description="List of insights")
