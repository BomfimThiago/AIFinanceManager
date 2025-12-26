import logging

from src.receipts.ai_parser import AIParser
from src.receipts.models import Receipt
from src.receipts.ocr_service import OCRService
from src.receipts.repository import ReceiptRepository
from src.receipts.schemas import ReceiptUpdate
from src.shared.constants import ReceiptStatus
from src.shared.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class ReceiptService:
    def __init__(
        self,
        repository: ReceiptRepository,
        ocr_service: OCRService,
        ai_parser: AIParser,
    ):
        self.repository = repository
        self.ocr_service = ocr_service
        self.ai_parser = ai_parser

    async def upload_and_process(
        self,
        file_data: bytes,
        file_url: str,
        user_id: int,
        is_pdf: bool = False,
    ) -> Receipt:
        """Upload and process a receipt image or PDF."""
        # Create receipt in pending state
        receipt = await self.repository.create(
            user_id=user_id,
            image_url=file_url,
            status=ReceiptStatus.PROCESSING,
        )

        try:
            # Extract text based on file type
            if is_pdf:
                raw_text = await self.ocr_service.extract_text_from_pdf(file_data)
            else:
                raw_text = await self.ocr_service.extract_text(file_data)

            # Parse with AI
            parsed_data = await self.ai_parser.parse_receipt(raw_text)

            # Update receipt with parsed data
            receipt = await self.repository.update_with_parsed_data(receipt, parsed_data, raw_text)

            return receipt

        except Exception as e:
            logger.error(f"Receipt processing failed: {e}")
            await self.repository.set_failed(receipt, str(e))
            raise

    async def get_receipt(self, receipt_id: int, user_id: int) -> Receipt:
        """Get a receipt by ID."""
        receipt = await self.repository.get_by_id(receipt_id, user_id)
        if not receipt:
            raise NotFoundError("Receipt", receipt_id)
        return receipt

    async def get_all_receipts(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Receipt]:
        """Get all receipts for a user."""
        return await self.repository.get_all_by_user(user_id, skip, limit)

    async def update_receipt(
        self,
        receipt_id: int,
        user_id: int,
        update_data: ReceiptUpdate,
    ) -> Receipt:
        """Update a receipt."""
        receipt = await self.get_receipt(receipt_id, user_id)
        return await self.repository.update(receipt, update_data)

    async def delete_receipt(self, receipt_id: int, user_id: int) -> None:
        """Delete a receipt."""
        receipt = await self.get_receipt(receipt_id, user_id)
        await self.repository.delete(receipt)
