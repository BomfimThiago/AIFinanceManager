import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.connection import get_db
from app.db.repositories import (
    BelvoInstitutionRepository,
    ExpenseRepository,
    IntegrationRepository,
)
from app.models.auth import User
from app.models.belvo_responses import (
    BelvoInstitutionResponse,
    BelvoWidgetTokenResponse,
    ConnectionSaveRequest,
    ConnectionSaveResponse,
    ConsentExpiredWebhookData,
    ConsentManagementRequest,
    ConsentManagementResponse,
    ConsentRenewalRequest,
    ConsentRenewalResponse,
    DeleteIntegrationResponse,
    HistoricalUpdateResponse,
    InstitutionsListResponse,
    IntegrationMetadata,
    IntegrationResponse,
    IntegrationsListResponse,
    SyncTransactionsResponse,
    WebhookResponse,
)
from app.models.integration import (
    IntegrationCreate,
    IntegrationStatus,
    IntegrationType,
    IntegrationUpdate,
)
from app.services.belvo_service import belvo_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/belvo/widget-token",
    response_model=BelvoWidgetTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Belvo Widget Token",
    description="Generate access token for Belvo widget integration",
)
async def get_belvo_widget_token(
    current_user: User = Depends(get_current_user),
) -> BelvoWidgetTokenResponse:
    """
    Generate Belvo widget access token for Brazil/Mexico.
    Simplified - no CPF/name required, just generate token for widget.
    """
    try:
        logger.info(f"Generating Belvo widget token for user {current_user.id}")

        # Generate external_id for tracking this user's request
        external_id = (
            f"user_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )
        access_token = await belvo_service.get_widget_access_token(external_id)

        # Construct widget URL
        widget_url = (
            f"https://widget.belvo.io/"
            f"?access_token={access_token}"
            f"&locale=en"
            f"&country=BR"
        )

        logger.info(
            f"Successfully generated Belvo widget token for user {current_user.id}"
        )

        return BelvoWidgetTokenResponse(
            access_token=access_token, widget_url=widget_url, expires_in=3600
        )

    except Exception as e:
        logger.error(
            f"Failed to generate Belvo widget token for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate widget token",
        )


@router.get(
    "/belvo/integrations",
    response_model=IntegrationsListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User Integrations",
    description="Retrieve all connected Belvo integrations for the current user",
)
async def get_user_integrations(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> IntegrationsListResponse:
    """Get user's connected Belvo integrations."""
    try:
        repo = IntegrationRepository(db)
        integrations = await repo.get_all_by_user_and_type(
            current_user.id, IntegrationType.BELVO
        )

        # Format response with institution data from belvo_institutions table
        institution_repo = BelvoInstitutionRepository(db)

        formatted_integrations = []
        for integration in integrations:
            # Get institution details from belvo_institutions table
            institution = None
            if integration.institution_id:
                try:
                    # Since institution_id now stores belvo_id, try to parse as integer first
                    institution_id_str = (
                        str(integration.institution_id)
                        if integration.institution_id
                        else ""
                    )
                    if institution_id_str.isdigit():
                        belvo_id = int(institution_id_str)
                        institution = await institution_repo.get_by_belvo_id(belvo_id)
                        logger.debug(
                            f"Looked up institution by belvo_id {belvo_id}: {'found' if institution else 'not found'}"
                        )
                    else:
                        # Fallback: try lookup by code for legacy data
                        institution = await institution_repo.get_by_code(
                            integration.institution_id
                        )
                        logger.debug(
                            f"Looked up institution by code {integration.institution_id}: {'found' if institution else 'not found'}"
                        )
                except (ValueError, TypeError) as e:
                    logger.warning(
                        f"Error parsing institution_id {integration.institution_id}: {e}"
                    )
                    institution = None

            # Prepare metadata from institution data
            metadata = IntegrationMetadata()
            if institution:
                metadata = IntegrationMetadata(
                    belvo_id=institution.belvo_id,
                    display_name=institution.display_name,
                    name=institution.name,
                    code=institution.code,
                    type=(
                        institution.type.value
                        if hasattr(institution.type, 'value')
                        else str(institution.type)
                    ),
                    status=(
                        institution.status.value
                        if hasattr(institution.status, 'value')
                        else str(institution.status)
                    ),
                    country_code=institution.country_code,
                    country_codes=institution.country_codes,
                    primary_color=institution.primary_color,
                    logo=institution.logo,
                    icon_logo=institution.icon_logo,
                    text_logo=institution.text_logo,
                    website=institution.website,
                )
                logger.debug(
                    f"Loaded metadata for institution {institution.belvo_id}: {institution.display_name}"
                )
            else:
                logger.warning(
                    f"No institution metadata found for integration {integration.id} with institution_id {integration.institution_id}"
                )

            formatted_integration = IntegrationResponse(
                id=integration.id,
                status=(
                    integration.status.value
                    if hasattr(integration.status, 'value')
                    else str(integration.status)
                ),
                institution_name=integration.institution_name or "",
                institution_id=(
                    str(integration.institution_id)
                    if integration.institution_id is not None
                    else ""
                ),
                last_sync=(
                    integration.last_sync.isoformat()
                    if integration.last_sync is not None
                    else None
                ),
                created_at=(
                    integration.created_at.isoformat()
                    if integration.created_at is not None
                    else None
                ),
                metadata=metadata,
            )
            formatted_integrations.append(formatted_integration)

        logger.info(
            f"Returning {len(formatted_integrations)} integrations for user {current_user.id}"
        )

        return IntegrationsListResponse(
            integrations=formatted_integrations, total=len(formatted_integrations)
        )

    except Exception as e:
        logger.error(f"Failed to get user integrations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get integrations",
        )


@router.post(
    "/belvo/save-connection",
    response_model=ConnectionSaveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save Belvo Connection",
    description="Save a successful Belvo connection from the widget",
)
async def save_belvo_connection(
    connection_data: ConnectionSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConnectionSaveResponse:
    """
    Save Belvo connection after successful widget flow.

    Expected data:
    {
        "link_id": "uuid-from-widget",
        "institution": {
            "raw_data": "name-of-institution"
        }
    }
    """
    try:
        link_id = connection_data.link_id.strip()
        institution = connection_data.institution

        if not link_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Link ID is required"
            )

        received_institution_name = institution.get(
            'raw_data', ''
        )  # This is the internal name from Belvo

        logger.info("Received institution data from frontend:")
        logger.info(f"Institution name: {received_institution_name}")

        # Create integration record
        repo = IntegrationRepository(db)
        institution_repo = BelvoInstitutionRepository(db)

        # Find the matching institution in our database
        db_institution = None
        institution_id = None
        institution_name = received_institution_name

        if not db_institution and received_institution_name:
            # Second try: lookup by internal name
            institutions = await institution_repo.get_all()
            for inst in institutions:
                if inst.name == received_institution_name:
                    db_institution = inst
                    logger.info(
                        f"Found institution by name '{received_institution_name}': {db_institution.display_name}"
                    )
                    break

        if db_institution:
            # Success! Store the belvo_id as institution_id
            institution_id = str(db_institution.belvo_id)
            institution_name = db_institution.display_name
            logger.info(
                f"✅ Matched institution: storing belvo_id {db_institution.belvo_id} as institution_id"
            )
        else:
            institution_id = None
            institution_name = received_institution_name
            logger.warning(
                f"⚠️ Institution not found in database. Using fallback institution_id: {institution_id}"
            )
            logger.warning(
                f"Available institutions: {[inst.name for inst in (await institution_repo.get_all())[:5]]}..."
            )

        integration_data = {
            'status': IntegrationStatus.CONNECTED,
            'account_id': link_id,
            'institution_id': institution_id,  # Store Belvo institution ID or code
            'institution_name': institution_name,
            'access_token': link_id,  # Store link_id for API calls
            'item_id': link_id,
            'last_sync': None,
            'error_message': None,
        }

        create_data = IntegrationCreate(
            integration_type=IntegrationType.BELVO, **integration_data
        )
        integration = await repo.create(current_user.id, create_data)

        logger.info(
            f"Saved Belvo integration {integration.id} for user {current_user.id}"
        )

        return ConnectionSaveResponse(
            integration_id=integration.id, institution_name=integration.institution_name
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save Belvo connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save connection",
        )


# Removed - replaced by get-transactions endpoint


@router.post(
    "/belvo/integrations/{integration_id}/sync-transactions",
    response_model=SyncTransactionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Sync Transactions",
    description="Manually sync transactions from Belvo and convert to expenses",
)
async def sync_belvo_transactions_endpoint(
    integration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SyncTransactionsResponse:
    """Manual transaction sync button - fetch all transactions and convert to expenses."""
    try:
        repo = IntegrationRepository(db)
        integration = await repo.get_by_id(integration_id)

        if not integration or integration.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Integration not found")

        if integration.status != IntegrationStatus.CONNECTED:
            raise HTTPException(status_code=400, detail="Integration is not connected")

        # Fetch all transactions from Belvo using the link_id
        access_token_str = (
            str(integration.access_token) if integration.access_token else ""
        )
        transactions = await belvo_service.get_all_transactions_paginated(
            access_token_str
        )

        # Convert to expenses (filter out income)
        expenses = await belvo_service.convert_to_expenses(transactions)

        # Save expenses to database
        expense_repo = ExpenseRepository(db)
        created_count = 0
        error_count = 0

        for expense_data in expenses:
            try:
                await expense_repo.create(expense_data)
                created_count += 1
            except Exception as e:
                error_count += 1
                logger.warning(f"Failed to save expense: {e}")

        # Update last sync time
        update_data = IntegrationUpdate(last_sync=datetime.now())
        await repo.update(integration_id, update_data)

        return SyncTransactionsResponse(
            transactions_fetched=len(transactions),
            expenses_created=created_count,
            errors=error_count,
        )

    except Exception as e:
        logger.error(
            f"Failed to sync transactions for integration {integration_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync transactions",
        )


@router.delete(
    "/belvo/integrations/{integration_id}",
    response_model=DeleteIntegrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Integration",
    description="Delete a specific Belvo integration",
)
async def delete_belvo_integration(
    integration_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeleteIntegrationResponse:
    """Delete a specific Belvo integration."""
    try:
        repo = IntegrationRepository(db)
        integration = await repo.get_by_id(integration_id)

        if not integration or integration.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Integration not found")

        # Delete the integration from our database
        deleted = await repo.delete(integration_id)

        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete integration")

        logger.info(
            f"Successfully deleted integration {integration_id} for user {current_user.id}"
        )

        return DeleteIntegrationResponse(
            message=f"Integration for {integration.institution_name} has been disconnected"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete integration {integration_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete integration",
        )


@router.post("/belvo/integrations/{integration_id}/trigger-update")
async def trigger_historical_update_endpoint(
    integration_id: int,
    resources: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger historical data update for specific resources using async workflow."""
    try:
        repo = IntegrationRepository(db)
        integration = await repo.get_by_id(integration_id)

        if not integration or integration.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Integration not found")

        if integration.status != IntegrationStatus.CONNECTED:
            raise HTTPException(status_code=400, detail="Integration is not connected")

        # Default to transactions if no resources specified
        if not resources:
            resources = ['TRANSACTIONS']

        # Trigger historical update
        access_token_str = (
            str(integration.access_token) if integration.access_token else ""
        )
        result = await belvo_service.trigger_historical_update(
            access_token_str, resources
        )

        logger.info(
            f"Historical update triggered for integration {integration_id}: {result.get('request_id')}"
        )

        return {
            "status": "update_requested",
            "request_id": result.get('request_id'),
            "resources": resources,
            "message": "Historical data update requested. Webhook will notify when complete.",
        }

    except Exception as e:
        logger.error(
            f"Failed to trigger historical update for integration {integration_id}: {e}"
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/belvo/institutions")
async def get_belvo_institutions(
    country_code: Optional[str] = None, db: AsyncSession = Depends(get_db)
):
    """Get Belvo institutions, optionally filtered by country."""
    try:
        repo = BelvoInstitutionRepository(db)

        if country_code:
            institutions = await repo.get_by_country(country_code.upper())
        else:
            institutions = await repo.get_all()

        # Format response
        formatted_institutions = []
        for institution in institutions:
            formatted_institution = {
                "id": institution.id,
                "belvo_id": institution.belvo_id,
                "name": institution.name,
                "display_name": institution.display_name,
                "code": institution.code,
                "type": (
                    institution.type.value
                    if hasattr(institution.type, 'value')
                    else str(institution.type)
                ),
                "status": (
                    institution.status.value
                    if hasattr(institution.status, 'value')
                    else str(institution.status)
                ),
                "country_code": institution.country_code,
                "country_codes": institution.country_codes,
                "primary_color": institution.primary_color,
                "logo": institution.logo,
                "icon_logo": institution.icon_logo,
                "text_logo": institution.text_logo,
                "website": institution.website,
                "created_at": (
                    institution.created_at.isoformat()
                    if institution.created_at is not None
                    else None
                ),
                "updated_at": (
                    institution.updated_at.isoformat()
                    if institution.updated_at is not None
                    else None
                ),
            }
            formatted_institutions.append(formatted_institution)

        return {
            "institutions": formatted_institutions,
            "total": len(formatted_institutions),
            "country_filter": country_code,
        }

    except Exception as e:
        logger.error(f"Failed to get Belvo institutions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get institutions")


@router.get("/belvo/institutions/{belvo_id}")
async def get_belvo_institution(belvo_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific Belvo institution by its Belvo ID."""
    try:
        repo = BelvoInstitutionRepository(db)
        institution = await repo.get_by_belvo_id(belvo_id)

        if not institution:
            raise HTTPException(status_code=404, detail="Institution not found")

        return {
            "id": institution.id,
            "belvo_id": institution.belvo_id,
            "name": institution.name,
            "display_name": institution.display_name,
            "code": institution.code,
            "type": (
                institution.type.value
                if hasattr(institution.type, 'value')
                else str(institution.type)
            ),
            "status": (
                institution.status.value
                if hasattr(institution.status, 'value')
                else str(institution.status)
            ),
            "country_code": institution.country_code,
            "country_codes": institution.country_codes,
            "primary_color": institution.primary_color,
            "logo": institution.logo,
            "icon_logo": institution.icon_logo,
            "text_logo": institution.text_logo,
            "website": institution.website,
            "created_at": (
                institution.created_at.isoformat()
                if institution.created_at is not None
                else None
            ),
            "updated_at": (
                institution.updated_at.isoformat()
                if institution.updated_at is not None
                else None
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get Belvo institution {belvo_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get institution")


@router.post(
    "/belvo/consent-management",
    response_model=ConsentManagementResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Consent Management Portal URL",
    description="Generate URL for users to manage their Belvo consents via My Belvo Portal (MBP)",
)
async def get_consent_management_url(
    request: ConsentManagementRequest, current_user: User = Depends(get_current_user)
) -> ConsentManagementResponse:
    """
    Generate consent management portal URL for user to manage their Belvo consents.

    This allows users to view and manage all consents they've granted to your application
    through the My Belvo Portal (MBP).
    """
    try:
        logger.info(f"Generating consent management URL for user {current_user.id}")

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

        logger.info(
            f"Successfully generated consent management URL for user {current_user.id}"
        )

        return ConsentManagementResponse(
            consent_management_url=consent_management_url,
            access_token=access_token,
            expires_in=3600,
        )

    except Exception as e:
        logger.error(
            f"Failed to generate consent management URL for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate consent management URL",
        )


@router.post(
    "/belvo/consent-renewal",
    response_model=ConsentRenewalResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Consent Renewal Portal URL",
    description="Generate URL for users to renew expired consents via My Belvo Portal (MBP)",
)
async def get_consent_renewal_url(
    request: ConsentRenewalRequest, current_user: User = Depends(get_current_user)
) -> ConsentRenewalResponse:
    """
    Generate consent renewal portal URL for user to renew an expired consent.

    This is typically called after receiving a consent_expired webhook from Belvo.
    """
    try:
        logger.info(
            f"Generating consent renewal URL for user {current_user.id}, consent {request.consent_id}"
        )

        # Generate access token for consent management
        access_token = await belvo_service.get_consent_management_token(
            cpf=request.cpf,
            full_name=request.full_name,
            cnpj=request.cnpj,
            terms_and_conditions_url=request.terms_and_conditions_url,
        )

        # URL encode the institution display name
        import urllib.parse

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

        logger.info(
            f"Successfully generated consent renewal URL for user {current_user.id}"
        )

        return ConsentRenewalResponse(
            consent_renewal_url=consent_renewal_url,
            access_token=access_token,
            expires_in=3600,
        )

    except Exception as e:
        logger.error(
            f"Failed to generate consent renewal URL for user {current_user.id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate consent renewal URL",
        )


@router.post("/belvo/webhook")
async def belvo_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Belvo webhooks with proper asynchronous workflow support."""
    try:
        body = await request.body()
        payload = json.loads(body.decode('utf-8'))

        webhook_id = payload.get('webhook_id', '')
        webhook_type = payload.get('webhook_type', '')
        webhook_code = payload.get('webhook_code', '')
        link_id = payload.get('link_id', '')
        request_id = payload.get('request_id', '')
        external_id = payload.get('external_id', '')
        data = payload.get('data', {})

        # 📝 LOG ALL WEBHOOKS RECEIVED
        logger.info("=" * 80)
        logger.info("🔔 BELVO WEBHOOK RECEIVED")
        logger.info(f"   📋 Webhook ID: {webhook_id}")
        logger.info(f"   🔗 Link ID: {link_id}")
        logger.info(f"   📂 Type: {webhook_type}")
        logger.info(f"   🏷️  Code: {webhook_code}")
        logger.info(f"   🆔 Request ID: {request_id}")
        logger.info(f"   👤 External ID: {external_id}")
        logger.info(f"   📊 Data: {json.dumps(data, indent=2)}")
        logger.info("=" * 80)

        # Find integration by link_id
        repo = IntegrationRepository(db)
        integration = await repo.get_by_access_token(link_id)

        if not integration:
            logger.warning(f"No integration found for link_id: {link_id}")
            # Debug: List existing integrations to help troubleshoot
            try:
                all_integrations = await repo.get_all()
                logger.info(f"Total integrations in database: {len(all_integrations)}")
                for i, integration_item in enumerate(
                    all_integrations[:5]
                ):  # Show first 5
                    logger.info(
                        f"Integration {i}: access_token={integration_item.access_token}, account_id={integration_item.account_id}"
                    )
            except Exception as debug_e:
                logger.error(f"Failed to debug integrations: {debug_e}")
            # Still return 202 to acknowledge webhook
            return JSONResponse(
                status_code=202,
                content={"status": "acknowledged", "reason": "Integration not found"},
            )

        # 🎯 ONLY PROCESS TRANSACTIONS WEBHOOKS
        if webhook_type != 'TRANSACTIONS':
            logger.info(
                f"⏭️ SKIPPING non-TRANSACTIONS webhook: {webhook_type}.{webhook_code}"
            )
            logger.info("   ℹ️ Only TRANSACTIONS webhooks are processed")
        else:
            logger.info(f"✅ PROCESSING TRANSACTIONS webhook: {webhook_code}")

            # Handle different TRANSACTIONS webhook codes per official Belvo documentation
            if webhook_code == 'historical_update':
                # Initial historical data load (past year of transactions)
                logger.info("📊 Processing historical_update webhook")
                await handle_historical_update_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == 'new_transactions_available':
                # New transactions found since last update (recurrent links)
                logger.info("🆕 Processing new_transactions_available webhook")
                await handle_new_transactions_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == 'transactions_updated':
                # Existing transactions were modified by the institution
                logger.info("✏️ Processing transactions_updated webhook")
                await handle_transactions_updated_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == 'transactions_deleted':
                # Transactions were deleted/deduplicated by Belvo
                logger.info("🗑️ Processing transactions_deleted webhook")
                await handle_transactions_deleted_webhook(
                    webhook_type, link_id, integration, data, db
                )

            elif webhook_code == 'consent_expired':
                # Handle consent expiration - user needs to renew consent
                logger.info("⚠️ Processing consent_expired webhook")
                await handle_consent_expired_webhook(
                    webhook_type, link_id, integration, data, db
                )

            else:
                logger.warning(f"🚨 Unknown TRANSACTIONS webhook code: {webhook_code}")
                logger.info(f"   📊 Data: {json.dumps(data, indent=2)}")

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
                "request_id": payload.get('request_id', ''),
            },
        )
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        # Return 202 even for errors to prevent retries
        return JSONResponse(
            status_code=202, content={"status": "error", "message": str(e)}
        )


async def handle_historical_update_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle historical_update webhook by fetching data from Belvo."""
    try:
        if webhook_type == 'TRANSACTIONS':
            logger.info(f"Processing historical TRANSACTIONS update for link {link_id}")
            logger.info(f"Transaction summary: {webhook_data}")

            # Fetch all transactions using GET request as per async workflow
            transactions = await belvo_service.get_all_transactions_paginated(link_id)
            logger.info(f"Fetched {len(transactions)} transactions from Belvo")

            # Convert to expenses (filter out income)
            expenses = await belvo_service.convert_to_expenses(transactions)
            logger.info(f"Converted {len(expenses)} transactions to expenses")

            # Save expenses to database
            expense_repo = ExpenseRepository(db)
            created_count = 0

            for expense_data in expenses:
                try:
                    await expense_repo.create(expense_data)
                    created_count += 1
                except Exception as e:
                    logger.warning(f"Failed to save expense: {e}")

            # Update integration last sync time
            repo = IntegrationRepository(db)
            update_data = IntegrationUpdate(last_sync=datetime.now())
            await repo.update(integration.id, update_data)

            logger.info(
                f"Historical update processed: {created_count} expenses created"
            )

        else:
            logger.info(
                f"⚠️ Unexpected TRANSACTIONS webhook type: {webhook_type} (should only be TRANSACTIONS)"
            )
            logger.info(f"   📊 Data: {webhook_data}")

    except Exception as e:
        logger.error(f"Failed to process historical update for {webhook_type}: {e}")
        raise


async def handle_consent_expired_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle consent_expired webhook by updating integration status."""
    try:
        logger.info(f"Processing consent_expired webhook for link {link_id}")
        logger.info(f"Consent data: {webhook_data}")

        # Extract consent expiration data
        consent_id = webhook_data.get('consent_id')
        institution_display_name = webhook_data.get('institution_display_name')

        # Update integration status to indicate consent has expired
        repo = IntegrationRepository(db)
        update_data = IntegrationUpdate(
            status=IntegrationStatus.ERROR,
            error_message=f"Consent expired for {institution_display_name}. User needs to renew consent.",
        )
        await repo.update(integration.id, update_data)

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
        raise


async def handle_new_transactions_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle new_transactions_available webhook for recurrent links.

    Official Belvo webhook for new transactions found since last update.
    Data format: {"new_transactions": 19}
    """
    try:
        new_count = webhook_data.get('new_transactions', 0)
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

            # Save new expenses to database
            expense_repo = ExpenseRepository(db)
            created_count = 0

            for expense_data in expenses:
                try:
                    await expense_repo.create(expense_data)
                    created_count += 1
                except Exception as e:
                    # Skip duplicates - normal for incremental updates
                    error_msg = str(e).lower()
                    if 'duplicate' in error_msg or 'unique constraint' in error_msg:
                        logger.debug(
                            f"Skipping duplicate transaction: {expense_data.description}"
                        )
                    else:
                        logger.warning(f"Failed to save expense: {e}")

            # Update integration last sync time
            repo = IntegrationRepository(db)
            update_data = IntegrationUpdate(last_sync=datetime.now())
            await repo.update(integration.id, update_data)

            logger.info(
                f"✅ New transactions processed: {created_count} new expenses created"
            )
        else:
            logger.info("ℹ️ No new transactions to process")

    except Exception as e:
        logger.error(f"Failed to process new_transactions_available webhook: {e}")
        raise


async def handle_transactions_updated_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle transactions_updated webhook.

    Official Belvo webhook for existing transactions that were modified.
    Data format: {"count": 5, "updated_transactions": ["id1", "id2", ...]}
    """
    try:
        count = webhook_data.get('count', 0)
        updated_ids = webhook_data.get('updated_transactions', [])

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

            # Convert and save (duplicates will be skipped automatically)
            expenses = await belvo_service.convert_to_expenses(transactions)
            expense_repo = ExpenseRepository(db)

            updated_count = 0
            for expense_data in expenses:
                try:
                    await expense_repo.create(expense_data)
                    updated_count += 1
                except Exception:
                    # Expected for existing transactions
                    pass

            logger.info(
                f"✅ Transaction updates processed: {updated_count} expenses affected"
            )
        else:
            logger.info("ℹ️ No transaction updates to process")

    except Exception as e:
        logger.error(f"Failed to process transactions_updated webhook: {e}")
        raise


async def handle_transactions_deleted_webhook(
    webhook_type: str, link_id: str, integration, webhook_data: dict, db: AsyncSession
):
    """Handle transactions_deleted webhook.

    Official Belvo webhook for transactions that were deleted/deduplicated.
    Data format: {"count": 5, "deleted_transactions": ["id1", "id2", ...]}
    """
    try:
        count = webhook_data.get('count', 0)
        deleted_ids = webhook_data.get('deleted_transactions', [])

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
        else:
            logger.info("ℹ️ No transactions were deleted")

    except Exception as e:
        logger.error(f"Failed to process transactions_deleted webhook: {e}")
        raise
