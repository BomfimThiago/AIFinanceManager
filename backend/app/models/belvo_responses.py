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