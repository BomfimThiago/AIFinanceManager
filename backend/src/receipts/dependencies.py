from typing import Annotated

from fastapi import Depends

from src.categories.dependencies import (
    get_category_repository,
    get_preference_service,
)
from src.categories.preference_service import CategoryPreferenceService
from src.categories.repository import CategoryRepository
from src.database import DbSession
from src.receipts.ai_parser import AIParser, get_ai_parser
from src.receipts.ocr_service import OCRService, get_ocr_service
from src.receipts.repository import ReceiptRepository
from src.receipts.service import ReceiptService


def get_receipt_repository(db: DbSession) -> ReceiptRepository:
    return ReceiptRepository(db)


def get_receipt_service(
    repository: Annotated[ReceiptRepository, Depends(get_receipt_repository)],
    ocr_service: Annotated[OCRService, Depends(get_ocr_service)],
    ai_parser: Annotated[AIParser, Depends(get_ai_parser)],
    category_repository: Annotated[CategoryRepository, Depends(get_category_repository)],
    preference_service: Annotated[CategoryPreferenceService, Depends(get_preference_service)],
) -> ReceiptService:
    return ReceiptService(
        repository,
        ocr_service,
        ai_parser,
        category_repository,
        preference_service,
    )
