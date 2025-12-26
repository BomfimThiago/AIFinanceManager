from src.core.logging import add_breadcrumb, get_logger, log_error, log_info
from src.receipts.ai_parser import AIParser
from src.receipts.models import Receipt
from src.receipts.ocr_service import OCRService
from src.receipts.repository import ReceiptRepository
from src.receipts.schemas import ReceiptUpdate
from src.shared.constants import ReceiptStatus
from src.shared.exceptions import NotFoundError

logger = get_logger(__name__)


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
        log_info(
            "Creating receipt record",
            user_id=user_id,
            file_url=file_url,
            is_pdf=is_pdf,
            file_size=len(file_data),
        )

        # Create receipt in pending state
        receipt = await self.repository.create(
            user_id=user_id,
            image_url=file_url,
            status=ReceiptStatus.PROCESSING,
        )

        log_info("Receipt record created", receipt_id=receipt.id)

        try:
            # Extract text based on file type
            add_breadcrumb(
                message="Starting OCR extraction",
                category="ocr",
                is_pdf=is_pdf,
            )

            log_info(
                "Starting OCR extraction",
                receipt_id=receipt.id,
                is_pdf=is_pdf,
            )

            if is_pdf:
                raw_text = await self.ocr_service.extract_text_from_pdf(file_data)
            else:
                raw_text = await self.ocr_service.extract_text(file_data)

            text_length = len(raw_text) if raw_text else 0
            log_info(
                "OCR extraction completed",
                receipt_id=receipt.id,
                text_length=text_length,
                text_preview=raw_text[:200] if raw_text else "NO TEXT",
            )

            add_breadcrumb(
                message="OCR extraction completed",
                category="ocr",
                text_length=text_length,
            )

            # Parse with AI
            log_info("Starting AI parsing", receipt_id=receipt.id)
            add_breadcrumb(message="Starting AI parsing", category="ai")

            parsed_data = await self.ai_parser.parse_receipt(raw_text)

            log_info(
                "AI parsing completed",
                receipt_id=receipt.id,
                parsed_data=parsed_data,
            )

            add_breadcrumb(
                message="AI parsing completed",
                category="ai",
                has_store_name=bool(parsed_data.store_name),
                has_total=bool(parsed_data.total_amount),
            )

            # Update receipt with parsed data
            log_info("Updating receipt with parsed data", receipt_id=receipt.id)
            receipt = await self.repository.update_with_parsed_data(receipt, parsed_data, raw_text)

            log_info(
                "Receipt processing completed successfully",
                receipt_id=receipt.id,
                store_name=receipt.store_name,
                total_amount=receipt.total_amount,
            )

            return receipt

        except Exception as e:
            log_error(
                "Receipt processing failed",
                error=e,
                receipt_id=receipt.id,
                user_id=user_id,
                is_pdf=is_pdf,
            )
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
