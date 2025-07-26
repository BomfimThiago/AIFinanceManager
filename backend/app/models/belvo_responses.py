from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BelvoWidgetTokenResponse(BaseModel):
    """Response model for Belvo widget token generation"""
    access_token: str = Field(..., description="Belvo widget access token")
    widget_url: str = Field(..., description="Complete Belvo widget URL")
    expires_in: int = Field(default=3600, description="Token expiration time in seconds")


class IntegrationMetadata(BaseModel):
    """Integration metadata model"""
    belvo_id: Optional[int] = None
    display_name: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    country_code: Optional[str] = None
    country_codes: Optional[List[str]] = None
    primary_color: Optional[str] = None
    logo: Optional[str] = None
    icon_logo: Optional[str] = None
    text_logo: Optional[str] = None
    website: Optional[str] = None


class IntegrationResponse(BaseModel):
    """Single integration response model"""
    id: int
    status: str
    institution_name: str
    institution_id: str
    last_sync: Optional[str] = None
    created_at: Optional[str] = None
    metadata: IntegrationMetadata


class IntegrationsListResponse(BaseModel):
    """List of integrations response model"""
    integrations: List[IntegrationResponse]
    total: int


class ConnectionSaveRequest(BaseModel):
    """Request model for saving Belvo connection"""
    link_id: str = Field(..., description="Belvo link ID from widget")
    institution: Dict[str, Any] = Field(..., description="Institution data from Belvo widget")


class ConnectionSaveResponse(BaseModel):
    """Response model for saving Belvo connection"""
    status: str = Field(default="success")
    integration_id: int
    institution_name: str


class SyncTransactionsResponse(BaseModel):
    """Response model for transaction sync"""
    status: str = Field(default="success")
    transactions_fetched: int
    expenses_created: int
    errors: int = Field(default=0)


class DeleteIntegrationResponse(BaseModel):
    """Response model for integration deletion"""
    status: str = Field(default="success")
    message: str


class HistoricalUpdateResponse(BaseModel):
    """Response model for historical update trigger"""
    status: str = Field(default="update_requested")
    request_id: Optional[str] = None
    resources: List[str]
    message: str


class BelvoInstitutionResponse(BaseModel):
    """Response model for a single Belvo institution"""
    id: int
    belvo_id: int
    name: str
    display_name: str
    code: str
    type: str
    status: str
    country_code: str
    country_codes: List[str]
    primary_color: str
    logo: Optional[str] = None
    icon_logo: Optional[str] = None
    text_logo: Optional[str] = None
    website: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class InstitutionsListResponse(BaseModel):
    """Response model for institutions list"""
    institutions: List[BelvoInstitutionResponse]
    total: int
    country_filter: Optional[str] = None


class WebhookResponse(BaseModel):
    """Response model for webhook acknowledgment"""
    status: str
    webhook_id: Optional[str] = None
    webhook_type: Optional[str] = None
    webhook_code: Optional[str] = None
    reason: Optional[str] = None
    message: Optional[str] = None


class ConsentManagementRequest(BaseModel):
    """Request model for consent management portal access"""
    cpf: str = Field(..., description="User's CPF number")
    full_name: str = Field(..., description="User's full name")
    cnpj: Optional[str] = Field(None, description="User's CNPJ (for business users)")
    terms_and_conditions_url: Optional[str] = Field(None, description="URL to your terms and conditions")


class ConsentManagementResponse(BaseModel):
    """Response model for consent management portal URL"""
    consent_management_url: str = Field(..., description="URL to Belvo consent management portal")
    access_token: str = Field(..., description="Access token for the portal")
    expires_in: int = Field(default=3600, description="Token expiration time in seconds")


class ConsentRenewalRequest(BaseModel):
    """Request model for consent renewal portal access"""
    cpf: str = Field(..., description="User's CPF number")
    full_name: str = Field(..., description="User's full name")
    link_id: str = Field(..., description="Belvo link ID from webhook")
    consent_id: str = Field(..., description="Consent ID from webhook")
    institution: str = Field(..., description="Institution code from webhook")
    institution_display_name: str = Field(..., description="Institution display name from webhook")
    institution_icon_logo: Optional[str] = Field(None, description="Institution logo URL from webhook")
    cnpj: Optional[str] = Field(None, description="User's CNPJ (for business users)")
    terms_and_conditions_url: Optional[str] = Field(None, description="URL to your terms and conditions")


class ConsentRenewalResponse(BaseModel):
    """Response model for consent renewal portal URL"""
    consent_renewal_url: str = Field(..., description="URL to Belvo consent renewal portal")
    access_token: str = Field(..., description="Access token for the portal")
    expires_in: int = Field(default=3600, description="Token expiration time in seconds")


class ConsentExpiredWebhookData(BaseModel):
    """Model for consent expired webhook data payload"""
    consent_id: str = Field(..., description="The consent ID that expired")
    action: str = Field(..., description="Action to take (always 'renew' for expired consents)")
    institution: str = Field(..., description="Institution code")
    institution_display_name: str = Field(..., description="Institution display name")
    institution_icon_logo: Optional[str] = Field(None, description="Institution logo URL")