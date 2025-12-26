from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile

from src.auth.dependencies import CurrentUser
from src.receipts.dependencies import get_receipt_service
from src.receipts.schemas import ReceiptResponse, ReceiptUpdate, ReceiptUploadResponse
from src.receipts.service import ReceiptService
from src.shared.constants import ReceiptStatus
from src.shared.exceptions import BadRequestError

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


@router.post("/upload", response_model=ReceiptUploadResponse, status_code=201)
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
    service: Annotated[ReceiptService, Depends(get_receipt_service)] = None,
) -> ReceiptUploadResponse:
    """Upload and process a receipt image or PDF."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise BadRequestError(
            "File type not allowed. Allowed: JPEG, PNG, WEBP, HEIC, PDF"
        )

    # Read file
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise BadRequestError(f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB")

    # TODO: Upload to cloud storage and get URL
    image_url = f"/uploads/{file.filename}"

    try:
        is_pdf = file.content_type == "application/pdf"
        receipt = await service.upload_and_process(
            file_data=content,
            file_url=image_url,
            user_id=current_user.id,
            is_pdf=is_pdf,
        )
        return ReceiptUploadResponse(
            receipt_id=receipt.id,
            status=receipt.status,
            message="Receipt processed successfully",
        )
    except Exception as e:
        return ReceiptUploadResponse(
            receipt_id=0,
            status=ReceiptStatus.FAILED,
            message=str(e),
        )


@router.get("", response_model=list[ReceiptResponse])
async def get_receipts(
    current_user: CurrentUser,
    service: Annotated[ReceiptService, Depends(get_receipt_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[ReceiptResponse]:
    """Get all receipts for the current user."""
    receipts = await service.get_all_receipts(current_user.id, skip, limit)
    return [ReceiptResponse.model_validate(r) for r in receipts]


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
