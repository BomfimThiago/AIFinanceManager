from fastapi import APIRouter

from src.shared.constants import ExpenseCategory

router = APIRouter()


@router.get("")
async def get_categories() -> list[dict[str, str]]:
    """Get all available expense categories."""
    return [
        {"value": category.value, "label": category.value.replace("_", " ").title()}
        for category in ExpenseCategory
    ]
