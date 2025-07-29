"""
Integration API router.

This module contains FastAPI routes for integration operations
including provider connections, transaction sync, and webhook processing.
"""

import json
import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.integrations.dependencies import (
    get_current_user_id,
    get_integration_service,
    get_user_integrations_service,
    valid_connected_integration,
    valid_owned_integration,
)
from src.integrations.institution_repository import BelvoInstitutionRepository
from src.integrations.models import Integration
from src.integrations.repository import IntegrationRepository
from src.integrations.schemas import (
    BelvoConnectionData,
    ConsentManagementRequest,
    ConsentRenewalRequest,
    IntegrationCreate,
    IntegrationFilter,
)
from src.integrations.service import IntegrationService
from src.shared.constants import IntegrationProvider, IntegrationStatus
from src.shared.dependencies import get_db
from src.shared.models import (
    ConflictResponse,
    ConnectionSaveResponse,
    ConsentManagementUrlResponse,
    ConsentRenewalUrlResponse,
    DeleteResponse,
    ForbiddenResponse,
    IntegrationListResponse,
    InternalServerErrorResponse,
    NotFoundResponse,
    SyncResponse,
    UnauthorizedResponse,
    ValidationErrorResponse,
    WebhookResponse,
    WidgetTokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/integrations", tags=["integrations"])


def integration_to_dict(integration: Integration) -> dict:
    """Convert Integration model to dictionary."""
    return {
        "id": integration.id,
        "user_id": integration.user_id,
        "provider": integration.provider,
        "institution_id": integration.institution_id,
        "institution_name": integration.institution_name,
        "institution_logo_url": integration.institution_logo_url,
        "institution_country": integration.institution_country,
        "status": integration.status,
        "created_at": integration.created_at.isoformat()
        if integration.created_at
        else None,
        "last_sync_at": integration.last_sync_at.isoformat()
        if integration.last_sync_at
        else None,
    }


# Belvo-specific endpoints


@router.post(
    "/belvo/widget-token",
    response_model=WidgetTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Belvo widget access token",
    description="Generate a secure access token for the Belvo widget to connect bank accounts",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def get_belvo_widget_token(user_id: Annotated[int, Depends(get_current_user_id)]):
    """Generate Belvo widget access token for bank account connection."""
    try:
        # Import Belvo service from the old structure for now
        # TODO: Refactor to use new service structure
        from src.services.belvo_service import belvo_service

        # Generate external_id for tracking this user's request
        external_id = f"user_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Get real access token from Belvo API
        access_token = await belvo_service.get_widget_access_token(external_id)

        # Construct widget URL
        widget_url = (
            f"https://widget.belvo.io/?access_token={access_token}&locale=en&country=BR"
        )

        return WidgetTokenResponse(
            access_token=access_token, widget_url=widget_url, expires_in=3600
        )

    except Exception as e:
        logger.error(f"Failed to generate Belvo widget token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate widget token: {e!s}",
        )


@router.post(
    "/belvo/save-connection",
    response_model=ConnectionSaveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Belvo bank connection",
    description="Save a new Belvo bank connection after successful widget authentication flow",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_409_CONFLICT: {"model": ConflictResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def save_belvo_connection(
    connection_data: BelvoConnectionData,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Save Belvo bank connection after successful widget authentication flow."""
    try:
        logger.info(f"Saving Belvo connection for user {user_id}")
        logger.info(f"Raw connection data: {connection_data}")
        logger.info(f"Link ID: {connection_data.link_id}")
        logger.info(f"Institution data: {connection_data.institution}")

        link_id = connection_data.link_id.strip()
        institution = connection_data.institution

        if not link_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Link ID is required"
            )

        # Extract institution name from the data (matching old working pattern)
        received_institution_name = institution.get("raw_data", "")

        logger.info("Received institution data from frontend:")
        logger.info(f"Institution name: {received_institution_name}")

        # Use repository pattern like the old working version
        repo = IntegrationRepository(db)
        institution_repo = BelvoInstitutionRepository(db)

        # Look up institution in the database for logo and metadata
        db_institution = None
        institution_name = received_institution_name or "Unknown Bank"
        institution_id = institution.get("id", link_id)
        institution_logo_url = None
        institution_website = None
        institution_country = "BR"  # Default

        if received_institution_name:
            # Try to find institution by name first
            db_institution = await institution_repo.get_by_name(
                received_institution_name
            )

            if not db_institution:
                # Try searching by display name
                db_institution = await institution_repo.search_by_display_name(
                    received_institution_name
                )

            if db_institution:
                # Found institution in database - use its metadata
                institution_id = str(db_institution.belvo_id)
                institution_name = db_institution.display_name
                institution_logo_url = db_institution.icon_logo or db_institution.logo
                institution_website = db_institution.website
                institution_country = db_institution.country_code
                logger.info(
                    f"✅ Found institution: {institution_name} with logo: {institution_logo_url}"
                )
            else:
                logger.warning(
                    f"⚠️ Institution '{received_institution_name}' not found in database"
                )
                # List some available institutions for debugging
                available_institutions = await institution_repo.get_all()
                if available_institutions:
                    logger.info(
                        f"Available institutions: {[inst.name for inst in available_institutions[:5]]}..."
                    )

        # Create integration data using the working pattern
        integration_data = IntegrationCreate(
            user_id=user_id,  # Include user_id in the data
            provider=IntegrationProvider.BELVO,  # Use enum instead of string
            provider_item_id=link_id,
            provider_access_token=link_id,  # Store link_id for API calls
            institution_id=str(institution_id),
            institution_name=institution_name,
            institution_logo_url=institution_logo_url,  # Use looked up logo
            institution_website=institution_website,  # Use looked up website
            institution_country=institution_country,  # Use looked up country
            connection_name=f"{institution_name} Connection",
            status=IntegrationStatus.CONNECTED,  # Use enum instead of string
            auto_sync_enabled=True,
            sync_data_types=["accounts", "transactions"],
            webhook_enabled=True,
        )

        integration = await repo.create(integration_data)

        logger.info(f"Saved Belvo integration {integration.id} for user {user_id}")

        return ConnectionSaveResponse(
            integration_id=integration.id,
            institution_name=integration.institution_name,
            success=True,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save Belvo connection: {e}", exc_info=True)
        logger.error(f"Integration data: {integration_data}")
        logger.error(f"Connection data: {connection_data}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save connection: {e!s}",
        )


@router.post(
    "/belvo/webhook",
    response_model=WebhookResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Process Belvo webhooks",
    description="Handle incoming Belvo webhooks for transaction updates, historical data, and consent management",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_202_ACCEPTED: {"model": WebhookResponse},
    },
)
async def belvo_webhook(request: Request, db: Annotated[AsyncSession, Depends(get_db)]):
    """Handle Belvo webhooks for transaction synchronization and consent management."""
    try:
        body = await request.body()
        payload = json.loads(body.decode("utf-8"))

        webhook_id = payload.get("webhook_id", "")
        webhook_type = payload.get("webhook_type", "")
        webhook_code = payload.get("webhook_code", "")
        link_id = payload.get("link_id", "")
        request_id = payload.get("request_id", "")
        external_id = payload.get("external_id", "")
        data = payload.get("data", {})

        # Import webhook logger
        from src.services.webhook_logger import webhook_logger

        # Log all webhooks received
        webhook_logger.log_webhook_received(
            webhook_type, webhook_code, link_id, payload
        )

        # Find integration by link_id
        repo = IntegrationRepository(db)
        integration = await repo.get_by_access_token(link_id)

        if not integration:
            webhook_logger.log_integration_lookup(link_id, False)
            # Debug: List existing integrations to help troubleshoot
            try:
                integrations = await repo.get_multi()
                logger.info(f"Total integrations in database: {len(integrations)}")
                for i, integration_item in enumerate(integrations[:5]):  # Show first 5
                    logger.info(
                        f"Integration {i}: provider_access_token={integration_item.provider_access_token}"
                    )
            except Exception as debug_e:
                logger.error(f"Failed to debug integrations: {debug_e}")

            # Still return 202 to acknowledge webhook
            return JSONResponse(
                status_code=202,
                content={"status": "acknowledged", "reason": "Integration not found"},
            )

        webhook_logger.log_integration_lookup(link_id, True, integration.id)

        # 🎯 ONLY PROCESS TRANSACTIONS WEBHOOKS
        if webhook_type != "TRANSACTIONS":
            logger.info(
                f"⏭️ SKIPPING non-TRANSACTIONS webhook: {webhook_type}.{webhook_code}"
            )
            logger.info("   ℹ️ Only TRANSACTIONS webhooks are processed")
        else:
            logger.info(f"✅ PROCESSING TRANSACTIONS webhook: {webhook_code}")

            # Handle different TRANSACTIONS webhook codes per official Belvo documentation
            if webhook_code == "historical_update":
                # Initial historical data load (past year of transactions)
                logger.info("📊 Processing historical_update webhook")
                await handle_historical_update_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == "new_transactions_available":
                # New transactions found since last update (recurrent links)
                logger.info("🆕 Processing new_transactions_available webhook")
                await handle_new_transactions_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == "transactions_updated":
                # Existing transactions were modified by the institution
                logger.info("✏️ Processing transactions_updated webhook")
                await handle_transactions_updated_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == "transactions_deleted":
                # Transactions were deleted/deduplicated by Belvo
                logger.info("🗑️ Processing transactions_deleted webhook")
                await handle_transactions_deleted_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == "consent_expired":
                # Handle consent expiration - user needs to renew consent
                logger.info("⚠️ Processing consent_expired webhook")
                await handle_consent_expired_webhook(
                    webhook_type, link_id, integration, data, db
                )

            else:
                logger.warning(f"🚨 Unknown TRANSACTIONS webhook code: {webhook_code}")
                webhook_logger.log_webhook_error(
                    webhook_type,
                    webhook_code,
                    link_id,
                    Exception(f"Unknown webhook code: {webhook_code}"),
                    {"data": data},
                )

        # Always return 202 Accepted as per Belvo best practices
        return JSONResponse(
            status_code=202,
            content={
                "status": "accepted",
                "webhook_id": webhook_id,
                "webhook_type": webhook_type,
                "webhook_code": webhook_code,
            },
        )

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in webhook: {e}")
        # Return 400 Bad Request for invalid JSON as per Belvo docs
        return JSONResponse(
            status_code=400,
            content={
                "error": "Invalid JSON",
                "request_id": payload.get("request_id", "")
                if "payload" in locals()
                else "",
            },
        )
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        if (
            "webhook_type" in locals()
            and "webhook_code" in locals()
            and "link_id" in locals()
        ):
            from src.services.webhook_logger import webhook_logger

            webhook_logger.log_webhook_error(webhook_type, webhook_code, link_id, e)
        # Return 202 even for errors to prevent retries
        return JSONResponse(
            status_code=202, content={"status": "error", "message": str(e)}
        )


# Additional endpoints to maintain API compatibility with frontend


@router.get(
    "/belvo/integrations",
    response_model=IntegrationListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Belvo integrations",
    description="Get all Belvo bank integrations for the current user with institution metadata",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def get_belvo_integrations(
    user_service: Annotated[
        tuple[int, IntegrationService], Depends(get_user_integrations_service)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all Belvo bank integrations for the current user with institution metadata."""
    try:
        user_id, service = user_service
        filters = IntegrationFilter(
            provider="belvo",
            status=None,
            institution_id=None,
            institution_country=None,
            sync_frequency=None,
            auto_sync_enabled=None,
            webhook_enabled=None,
            has_errors=None,
            last_sync_before=None,
            last_sync_after=None,
            created_after=None,
            created_before=None,
        )
        integrations = await service.get_user_integrations(user_id, filters)
        institution_repo = BelvoInstitutionRepository(db)

        # Format integrations with institution metadata like the old API
        formatted_integrations = []
        for integration in integrations:
            integration_dict = integration_to_dict(integration)

            # Look up institution metadata if we have institution_id
            if integration.institution_id is not None:
                try:
                    institution_id_str = str(integration.institution_id)
                    if institution_id_str.isdigit():
                        belvo_id = int(institution_id_str)
                        db_institution = await institution_repo.get_by_belvo_id(
                            belvo_id
                        )
                    else:
                        db_institution = await institution_repo.get_by_code(
                            institution_id_str
                        )

                    if db_institution:
                        # Add institution metadata to the response
                        integration_dict["metadata"] = {
                            "belvo_id": db_institution.belvo_id,
                            "display_name": db_institution.display_name,
                            "name": db_institution.name,
                            "code": db_institution.code,
                            "type": db_institution.type,
                            "status": db_institution.status,
                            "country_code": db_institution.country_code,
                            "country_codes": db_institution.country_codes,
                            "primary_color": db_institution.primary_color,
                            "logo": db_institution.logo,
                            "icon_logo": db_institution.icon_logo,
                            "text_logo": db_institution.text_logo,
                            "website": db_institution.website,
                        }
                        logger.debug(
                            f"Added metadata for institution {db_institution.display_name}"
                        )
                    else:
                        integration_dict["metadata"] = {}
                        logger.warning(
                            f"No metadata found for institution_id {integration.institution_id}"
                        )

                except (ValueError, TypeError) as e:
                    logger.warning(
                        f"Error parsing institution_id {integration.institution_id}: {e}"
                    )
                    integration_dict["metadata"] = {}
            else:
                integration_dict["metadata"] = {}

            formatted_integrations.append(integration_dict)

        return {
            "integrations": formatted_integrations,
            "total": len(formatted_integrations),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Belvo integrations: {e!s}",
        )


@router.post(
    "/belvo/sync/{integration_id}",
    response_model=SyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync Belvo integration data",
    description="Manually trigger synchronization of transactions and account data from Belvo",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_403_FORBIDDEN: {"model": ForbiddenResponse},
        status.HTTP_404_NOT_FOUND: {"model": NotFoundResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def sync_belvo_integration(
    integration: Annotated[Integration, Depends(valid_connected_integration)],
    service: Annotated[IntegrationService, Depends(get_integration_service)],
):
    """Manually trigger synchronization of transactions and account data from Belvo integration."""
    try:
        result = await service.sync_integration(integration.id, integration.user_id)
        return result.model_dump()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {e!s}",
        )


@router.delete(
    "/belvo/integrations/{integration_id}",
    response_model=DeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Belvo integration",
    description="Remove a Belvo bank integration and disconnect the bank account",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_403_FORBIDDEN: {"model": ForbiddenResponse},
        status.HTTP_404_NOT_FOUND: {"model": NotFoundResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def delete_belvo_integration(
    integration: Annotated[Integration, Depends(valid_owned_integration)],
    service: Annotated[IntegrationService, Depends(get_integration_service)],
):
    """Remove a Belvo bank integration and disconnect the associated bank account."""
    try:
        success = await service.delete_integration(integration.id, integration.user_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete integration",
            )

        return DeleteResponse(
            message=f"Integration {integration.institution_name} deleted successfully",
            deleted_id=integration.id,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete integration: {e!s}",
        )


@router.post(
    "/belvo/integrations/{integration_id}/sync-transactions",
    response_model=SyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync Belvo transactions",
    description="Synchronize transactions from a specific Belvo integration",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_403_FORBIDDEN: {"model": ForbiddenResponse},
        status.HTTP_404_NOT_FOUND: {"model": NotFoundResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def sync_belvo_transactions(
    integration: Annotated[Integration, Depends(valid_connected_integration)],
    service: Annotated[IntegrationService, Depends(get_integration_service)],
):
    """Synchronize transaction data from a specific Belvo bank integration."""
    try:
        from src.integrations.schemas import SyncRequest

        sync_request = SyncRequest(sync_type="incremental", data_types=["transactions"])
        result = await service.sync_integration(
            integration.id, integration.user_id, sync_request
        )
        return result.model_dump()

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transaction sync failed for {integration.institution_name}: {e!s}",
        )


@router.post(
    "/belvo/consent-management",
    response_model=ConsentManagementUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Get consent management URL",
    description="Generate a secure URL for users to manage their Belvo bank consents",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def get_consent_management_url(
    request: ConsentManagementRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> ConsentManagementUrlResponse:
    """Generate a secure URL for users to access the Belvo consent management portal."""
    try:
        from src.services.belvo_service import belvo_service

        logger.info(f"Generating consent management URL for user {user_id}")

        # Generate access token for consent management
        access_token = await belvo_service.get_consent_management_token(
            cpf=request.cpf,
            full_name=request.full_name,
            cnpj=request.cnpj,
            terms_and_conditions_url=request.terms_and_conditions_url,
        )

        # Construct MBP URL with access token
        consent_management_url = (
            f"https://meuportal.belvo.com/?access_token={access_token}"
        )

        logger.info(f"Successfully generated consent management URL for user {user_id}")

        return ConsentManagementUrlResponse(
            consent_management_url=consent_management_url,
            access_token=access_token,
            expires_in=3600,
        )

    except Exception as e:
        logger.error(
            f"Failed to generate consent management URL for user {user_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate consent management URL",
        )


@router.post(
    "/belvo/consent-renewal",
    response_model=ConsentRenewalUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Get consent renewal URL",
    description="Generate a secure URL for users to renew expired Belvo bank consents",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ValidationErrorResponse},
        status.HTTP_401_UNAUTHORIZED: {"model": UnauthorizedResponse},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": InternalServerErrorResponse},
    },
)
async def get_consent_renewal_url(
    request: ConsentRenewalRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> ConsentRenewalUrlResponse:
    """Generate a secure URL for users to renew expired Belvo bank consents."""
    try:
        import urllib.parse

        from src.services.belvo_service import belvo_service

        logger.info(
            f"Generating consent renewal URL for user {user_id}, consent {request.consent_id}"
        )

        # Generate access token for consent management
        access_token = await belvo_service.get_consent_management_token(
            cpf=request.cpf,
            full_name=request.full_name,
            cnpj=request.cnpj,
            terms_and_conditions_url=request.terms_and_conditions_url,
        )

        # URL encode the institution display name
        encoded_display_name = urllib.parse.quote(request.institution_display_name)

        # Construct MBP renewal URL with all required parameters
        consent_renewal_url = (
            f"https://meuportal.belvo.com/"
            f"?access_token={access_token}"
            f"&link_id={request.link_id}"
            f"&consent_id={request.consent_id}"
            f"&institution={request.institution}"
            f"&institution_display_name={encoded_display_name}"
            f"&action=renew"
        )

        # Add institution logo if provided
        if request.institution_icon_logo:
            consent_renewal_url += f"&institution_icon_logo={urllib.parse.quote(request.institution_icon_logo)}"

        logger.info(f"Successfully generated consent renewal URL for user {user_id}")

        return ConsentRenewalUrlResponse(
            consent_renewal_url=consent_renewal_url,
            access_token=access_token,
            expires_in=3600,
        )

    except Exception as e:
        logger.error(f"Failed to generate consent renewal URL for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate consent renewal URL",
        )


# Webhook Handler Functions
# These functions process different types of Belvo webhooks with comprehensive logging


async def handle_historical_update_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle historical_update webhook by fetching data from Belvo."""
    from src.services.belvo_service import belvo_service
    from src.services.webhook_logger import webhook_logger

    try:
        if webhook_type == "TRANSACTIONS":
            logger.info(f"Processing historical TRANSACTIONS update for link {link_id}")
            webhook_logger.log_transaction_summary(link_id, 0, webhook_data)

            # Fetch all transactions using GET request as per async workflow
            transactions = await belvo_service.get_all_transactions_paginated(link_id)
            logger.info(f"Fetched {len(transactions)} transactions from Belvo")
            webhook_logger.log_transaction_summary(
                link_id, len(transactions), webhook_data
            )

            # Convert to expenses (filter out income) - but don't save yet, just log
            expenses = await belvo_service.convert_to_expenses(transactions)
            logger.info(f"Converted {len(expenses)} transactions to expenses")

            # TODO: Save expenses to database when ready
            # For now, just log the processing result
            processing_result = {
                "webhook_type": "historical_update",
                "transactions_fetched": len(transactions),
                "expenses_converted": len(expenses),
                "action": "logged_only_not_saved",
            }

            webhook_logger.log_webhook_processed(
                webhook_type, "historical_update", link_id, processing_result
            )

            # Update integration last sync time
            integration.last_sync_at = datetime.now(timezone.utc)
            integration.last_successful_sync_at = datetime.now(timezone.utc)
            db.add(integration)
            await db.commit()

            logger.info(
                f"Historical update processed: {len(expenses)} expenses converted (not saved)"
            )

        else:
            logger.info(
                f"⚠️ Unexpected webhook type: {webhook_type} (should only be TRANSACTIONS)"
            )
            webhook_logger.log_webhook_error(
                webhook_type,
                "historical_update",
                link_id,
                Exception(f"Unexpected webhook type: {webhook_type}"),
                {"webhook_data": webhook_data},
            )

    except Exception as e:
        logger.error(f"Failed to process historical update for {webhook_type}: {e}")
        webhook_logger.log_webhook_error(
            webhook_type,
            "historical_update",
            link_id,
            e,
            {"webhook_data": webhook_data},
        )
        raise


async def handle_new_transactions_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle new_transactions_available webhook for recurrent links."""
    from src.services.belvo_service import belvo_service
    from src.services.webhook_logger import webhook_logger

    try:
        new_count = webhook_data.get("new_transactions", 0)
        logger.info(
            f"📈 New transactions available: {new_count} transactions for link {link_id}"
        )

        if new_count > 0:
            # Fetch all transactions using GET request (as per async workflow)
            transactions = await belvo_service.get_all_transactions_paginated(link_id)
            logger.info(f"Fetched {len(transactions)} total transactions")

            # Convert to expenses
            expenses = await belvo_service.convert_to_expenses(transactions)
            logger.info(f"Converted {len(expenses)} transactions to expenses")

            # TODO: Save new expenses to database when ready
            # For now, just log the processing result
            processing_result = {
                "webhook_type": "new_transactions_available",
                "new_transactions_reported": new_count,
                "transactions_fetched": len(transactions),
                "expenses_converted": len(expenses),
                "action": "logged_only_not_saved",
            }

            webhook_logger.log_webhook_processed(
                webhook_type, "new_transactions_available", link_id, processing_result
            )

            # Update integration last sync time
            integration.last_sync_at = datetime.now(timezone.utc)
            integration.last_successful_sync_at = datetime.now(timezone.utc)
            db.add(integration)
            await db.commit()

            logger.info(
                f"✅ New transactions processed: {len(expenses)} expenses converted (not saved)"
            )
        else:
            logger.info("ℹ️ No new transactions to process")
            processing_result = {
                "webhook_type": "new_transactions_available",
                "new_transactions_reported": 0,
                "action": "no_transactions_to_process",
            }
            webhook_logger.log_webhook_processed(
                webhook_type, "new_transactions_available", link_id, processing_result
            )

    except Exception as e:
        logger.error(f"Failed to process new_transactions_available webhook: {e}")
        webhook_logger.log_webhook_error(
            webhook_type,
            "new_transactions_available",
            link_id,
            e,
            {"webhook_data": webhook_data},
        )
        raise


async def handle_transactions_updated_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle transactions_updated webhook."""
    from src.services.belvo_service import belvo_service
    from src.services.webhook_logger import webhook_logger

    try:
        count = webhook_data.get("count", 0)
        updated_ids = webhook_data.get("updated_transactions", [])

        logger.info(
            f"✏️ Transactions updated: {count} transactions modified for link {link_id}"
        )
        logger.info(f"   📋 Updated transaction IDs: {updated_ids}")

        if count > 0 and updated_ids:
            # Note: We could implement specific update logic here
            # For now, we'll re-fetch all transactions to ensure consistency
            transactions = await belvo_service.get_all_transactions_paginated(link_id)
            logger.info(
                f"Re-fetched {len(transactions)} transactions to handle updates"
            )

            # Convert and process (but don't save yet)
            expenses = await belvo_service.convert_to_expenses(transactions)

            processing_result = {
                "webhook_type": "transactions_updated",
                "updated_count": count,
                "updated_ids": updated_ids,
                "transactions_fetched": len(transactions),
                "expenses_converted": len(expenses),
                "action": "logged_only_not_saved",
            }

            webhook_logger.log_webhook_processed(
                webhook_type, "transactions_updated", link_id, processing_result
            )

            logger.info(
                f"✅ Transaction updates processed: {len(expenses)} expenses affected (not saved)"
            )
        else:
            logger.info("ℹ️ No transaction updates to process")
            processing_result = {
                "webhook_type": "transactions_updated",
                "updated_count": 0,
                "action": "no_updates_to_process",
            }
            webhook_logger.log_webhook_processed(
                webhook_type, "transactions_updated", link_id, processing_result
            )

    except Exception as e:
        logger.error(f"Failed to process transactions_updated webhook: {e}")
        webhook_logger.log_webhook_error(
            webhook_type,
            "transactions_updated",
            link_id,
            e,
            {"webhook_data": webhook_data},
        )
        raise


async def handle_transactions_deleted_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle transactions_deleted webhook."""
    from src.services.webhook_logger import webhook_logger

    try:
        count = webhook_data.get("count", 0)
        deleted_ids = webhook_data.get("deleted_transactions", [])

        logger.info(
            f"🗑️ Transactions deleted: {count} transactions removed for link {link_id}"
        )
        logger.info(f"   📋 Deleted transaction IDs: {deleted_ids}")

        if count > 0 and deleted_ids:
            # Note: We could implement specific deletion logic here
            # This would require storing Belvo transaction IDs in our expense records
            # For now, we'll log the deletion event
            logger.info(f"ℹ️ Belvo cleaned up {count} duplicate transactions")
            logger.info("   💡 Consider implementing expense cleanup if needed")

            processing_result = {
                "webhook_type": "transactions_deleted",
                "deleted_count": count,
                "deleted_ids": deleted_ids,
                "action": "logged_only_cleanup_not_implemented",
            }

            webhook_logger.log_webhook_processed(
                webhook_type, "transactions_deleted", link_id, processing_result
            )
        else:
            logger.info("ℹ️ No transactions were deleted")
            processing_result = {
                "webhook_type": "transactions_deleted",
                "deleted_count": 0,
                "action": "no_deletions_to_process",
            }
            webhook_logger.log_webhook_processed(
                webhook_type, "transactions_deleted", link_id, processing_result
            )

    except Exception as e:
        logger.error(f"Failed to process transactions_deleted webhook: {e}")
        webhook_logger.log_webhook_error(
            webhook_type,
            "transactions_deleted",
            link_id,
            e,
            {"webhook_data": webhook_data},
        )
        raise


async def handle_consent_expired_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle consent_expired webhook by updating integration status."""
    from src.services.webhook_logger import webhook_logger

    try:
        logger.info(f"Processing consent_expired webhook for link {link_id}")
        logger.info(f"Consent data: {webhook_data}")

        # Extract consent expiration data
        consent_id = webhook_data.get("consent_id")
        institution_display_name = webhook_data.get("institution_display_name")

        # Update integration status to indicate consent has expired
        integration.status = IntegrationStatus.ERROR
        integration.error_message = f"Consent expired for {institution_display_name}. User needs to renew consent."
        integration.consent_expiry_date = datetime.now(timezone.utc)
        db.add(integration)
        await db.commit()

        processing_result = {
            "webhook_type": "consent_expired",
            "consent_id": consent_id,
            "institution_display_name": institution_display_name,
            "integration_id": integration.id,
            "action": "integration_status_updated_to_error",
        }

        webhook_logger.log_webhook_processed(
            webhook_type, "consent_expired", link_id, processing_result
        )

        logger.info(
            f"Updated integration {integration.id} status due to consent expiration"
        )
        logger.info(
            f"Consent {consent_id} for institution {institution_display_name} requires renewal"
        )

        # TODO: You could also:
        # 1. Send notification to user about consent expiration
        # 2. Store consent renewal data for later use
        # 3. Trigger automatic consent renewal process

    except Exception as e:
        logger.error(f"Failed to process consent_expired webhook: {e}")
        webhook_logger.log_webhook_error(
            webhook_type, "consent_expired", link_id, e, {"webhook_data": webhook_data}
        )
        raise
