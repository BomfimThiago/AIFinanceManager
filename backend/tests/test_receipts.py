"""Tests for receipt endpoints and service."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.receipts.models import Receipt
from src.shared.constants import ReceiptStatus


@pytest.mark.asyncio
async def test_get_receipts_returns_user_only(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_user_2: User,
    test_receipt: Receipt,
):
    """User can only see their own receipts."""
    # Create a receipt for user 2
    other_receipt = Receipt(
        user_id=test_user_2.id,
        image_url="https://example.com/other.jpg",
        status=ReceiptStatus.COMPLETED,
        store_name="Other Store",
    )
    db_session.add(other_receipt)
    await db_session.commit()

    # Get receipts as test_user (authenticated via client fixture)
    response = await client.get("/api/v1/receipts")

    assert response.status_code == 200
    receipts = response.json()

    # Should only see test_user's receipt
    assert len(receipts) == 1
    assert receipts[0]["id"] == test_receipt.id
    assert receipts[0]["storeName"] == "Test Store"


@pytest.mark.asyncio
async def test_get_receipt_by_id(
    client: AsyncClient,
    test_receipt: Receipt,
):
    """Get a specific receipt by ID."""
    response = await client.get(f"/api/v1/receipts/{test_receipt.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_receipt.id
    assert data["storeName"] == "Test Store"
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_get_receipt_not_found(client: AsyncClient):
    """Getting non-existent receipt returns 404."""
    response = await client.get("/api/v1/receipts/99999")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_receipt(
    client: AsyncClient,
    db_session: AsyncSession,
    test_receipt: Receipt,
):
    """Delete a receipt."""
    response = await client.delete(f"/api/v1/receipts/{test_receipt.id}")

    assert response.status_code == 204

    # Verify it's deleted
    response = await client.get(f"/api/v1/receipts/{test_receipt.id}")
    assert response.status_code == 404
