from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Request, UploadFile

from src.auth.dependencies import CurrentUser
from src.core.logging import add_breadcrumb, get_logger, log_error, log_info, set_user_context
from src.core.rate_limiter import rate_limit_read, rate_limit_upload
from src.database import async_session_maker
from src.receipts.dependencies import get_receipt_service
from src.receipts.schemas import ReceiptResponse, ReceiptUpdate, ReceiptUploadResponse
from src.receipts.service import ReceiptService
from src.shared.constants import ReceiptStatus
from src.shared.exceptions import FileTooLargeError, InvalidFileTypeError
from src.shared.schemas import PaginatedResponse, PaginationQuery

logger = get_logger(__name__)
router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
}


async def process_receipt_task(
    receipt_id: int,
    file_data: bytes,
    user_id: int,
    is_pdf: bool = False,
):
    """Background task to process receipt with its own database session."""
    from src.categories.preference_service import CategoryPreferenceService
    from src.categories.repository import CategoryRepository
    from src.receipts.ai_parser import get_ai_parser
    from src.receipts.ocr_service import get_ocr_service
    from src.receipts.repository import ReceiptRepository

    logger.info(f"Starting background task for receipt {receipt_id}")

    # Create a new database session for this background task
    async with async_session_maker() as db:
        try:
            # Initialize all services with the new session
            receipt_repo = ReceiptRepository(db)
            ocr_service = get_ocr_service()
            ai_parser = get_ai_parser()
            category_repo = CategoryRepository(db)
            preference_service = CategoryPreferenceService(category_repo)

            # Create service instance with all dependencies
            service = ReceiptService(
                repository=receipt_repo,
                ocr_service=ocr_service,
                ai_parser=ai_parser,
                category_repository=category_repo,
                preference_service=preference_service,
            )

            # Process the receipt
            await service.process_receipt_background(
                receipt_id=receipt_id,
                file_data=file_data,
                user_id=user_id,
                is_pdf=is_pdf,
            )

            logger.info(f"Background task completed for receipt {receipt_id}")

        except Exception as e:
            logger.error(f"Background task failed for receipt {receipt_id}: {e}")
            raise


@router.post("/upload", response_model=ReceiptUploadResponse, status_code=201)
@rate_limit_upload()
async def upload_receipt(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
    service: Annotated[ReceiptService, Depends(get_receipt_service)] = None,
    request: Request = None,
) -> ReceiptUploadResponse:
    """Upload and process a receipt image or PDF.

    Creates a receipt immediately and processes it in the background.
    The receipt status will be 'processing' initially and will change to
    'completed' or 'failed' once background processing finishes.
    """
    # Set user context for Sentry
    set_user_context(current_user.id, current_user.email)

    log_info(
        "Receipt upload started",
        user_id=current_user.id,
        filename=file.filename,
        content_type=file.content_type,
    )

    add_breadcrumb(
        message="Receipt upload initiated",
        category="receipt",
        filename=file.filename,
        content_type=file.content_type,
    )

    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        log_error(
            "Invalid file type uploaded",
            content_type=file.content_type,
            allowed_types=list(ALLOWED_TYPES),
            user_id=current_user.id,
        )
        raise InvalidFileTypeError(file.content_type, list(ALLOWED_TYPES))

    # Read file
    content = await file.read()
    file_size = len(content)

    log_info(
        "File read successfully",
        file_size=file_size,
        file_size_mb=round(file_size / (1024 * 1024), 2),
    )

    # Validate file size
    if file_size > MAX_FILE_SIZE:
        log_error(
            "File too large",
            file_size=file_size,
            max_size=MAX_FILE_SIZE,
            user_id=current_user.id,
        )
        raise FileTooLargeError(file_size, MAX_FILE_SIZE)

    # TODO: Upload to cloud storage and get URL
    image_url = f"/uploads/{file.filename}"

    try:
        is_pdf = file.content_type == "application/pdf"

        add_breadcrumb(
            message="Creating receipt record",
            category="receipt",
            is_pdf=is_pdf,
            file_size=file_size,
        )

        log_info(
            "Creating receipt record",
            is_pdf=is_pdf,
            user_id=current_user.id,
        )

        # Create receipt immediately (fast operation)
        receipt = await service.create_receipt(
            file_url=image_url,
            user_id=current_user.id,
        )

        log_info(
            "Receipt created, starting background processing",
            receipt_id=receipt.id,
            user_id=current_user.id,
        )

        # Schedule background processing with isolated database session
        background_tasks.add_task(
            process_receipt_task,
            receipt_id=receipt.id,
            file_data=content,
            user_id=current_user.id,
            is_pdf=is_pdf,
        )

        return ReceiptUploadResponse(
            receipt_id=receipt.id,
            status=ReceiptStatus.PROCESSING,
            message="Receipt uploaded. Processing in background. Refresh to see status.",
        )
    except Exception as e:
        log_error(
            "Receipt creation failed",
            error=e,
            user_id=current_user.id,
            filename=file.filename,
            content_type=file.content_type,
            file_size=file_size,
        )

        return ReceiptUploadResponse(
            receipt_id=0,
            status=ReceiptStatus.FAILED,
            message=str(e),
        )


@router.get("")
@rate_limit_read()
async def get_receipts(
    pagination: Annotated[PaginationQuery, Depends()],
    current_user: CurrentUser,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
    request: Request = None,
) -> PaginatedResponse[ReceiptResponse]:
    """Get paginated receipts for the current user."""
    receipts, total = await service.get_paginated_receipts(
        user_id=current_user.id,
        offset=pagination.offset,
        limit=pagination.limit,
    )
    receipt_responses = [ReceiptResponse.model_validate(r) for r in receipts]
    return PaginatedResponse.create(
        items=receipt_responses,
        total=total,
        page=pagination.page,
        limit=pagination.limit,
    )


@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: int,
    current_user: CurrentUser,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ReceiptResponse:
    """Get a specific receipt."""
    receipt = await service.get_receipt(receipt_id, current_user.id)
    return ReceiptResponse.model_validate(receipt)


@router.patch("/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: int,
    update_data: ReceiptUpdate,
    current_user: CurrentUser,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> ReceiptResponse:
    """Update a receipt."""
    receipt = await service.update_receipt(receipt_id, current_user.id, update_data)
    return ReceiptResponse.model_validate(receipt)


@router.delete("/{receipt_id}", status_code=204)
async def delete_receipt(
    receipt_id: int,
    current_user: CurrentUser,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
) -> None:
    """Delete a receipt."""
    await service.delete_receipt(receipt_id, current_user.id)
