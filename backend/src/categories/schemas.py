from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from src.shared.constants import CategoryType


class CategoryCreate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType
    icon: str = Field(..., max_length=50)
    color: str = Field(..., pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    name: str | None = Field(None, min_length=1, max_length=100)
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    is_hidden: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: int
    name: str
    type: CategoryType
    icon: str
    color: str
    is_default: bool
    is_hidden: bool
    default_category_key: str | None
    created_at: datetime
    updated_at: datetime
