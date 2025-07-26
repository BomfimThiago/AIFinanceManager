from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class IntegrationType(str, Enum):
    PLAID = "plaid"
    BELVO = "belvo"


class IntegrationStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    PENDING = "pending"


class Integration(BaseModel):
    id: int
    user_id: int
    integration_type: IntegrationType
    status: IntegrationStatus
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    access_token: Optional[str] = None
    item_id: Optional[str] = None  # Plaid-specific
    cursor: Optional[str] = None  # For incremental updates
    last_sync: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class IntegrationCreate(BaseModel):
    integration_type: IntegrationType
    status: Optional[IntegrationStatus] = IntegrationStatus.PENDING
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    access_token: Optional[str] = None
    item_id: Optional[str] = None


class IntegrationUpdate(BaseModel):
    status: Optional[IntegrationStatus] = None
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    access_token: Optional[str] = None
    cursor: Optional[str] = None
    last_sync: Optional[datetime] = None
    error_message: Optional[str] = None


# Plaid Models
class PlaidLinkToken(BaseModel):
    link_token: str
    expiration: datetime


class PlaidPublicTokenExchange(BaseModel):
    public_token: str
    metadata: Dict[str, Any]


class PlaidAccount(BaseModel):
    id: str
    name: str
    type: str
    subtype: str
    balance: float
    currency: str
    institution_id: str


class PlaidTransaction(BaseModel):
    id: str
    account_id: str
    amount: float
    currency: str
    date: datetime
    name: str
    merchant_name: Optional[str] = None
    category: List[str] = []
    pending: bool = False


# Belvo Models
class BelvoLink(BaseModel):
    institution: str
    username: str
    password: str
    access_mode: str = "single"


class BelvoAccount(BaseModel):
    id: str
    name: str
    type: str
    balance: float
    currency: str
    institution: str


class BelvoTransaction(BaseModel):
    id: str
    account: Dict[str, Any]  # Account object with id, name, etc.
    amount: float
    currency: str
    value_date: datetime
    description: str
    category: Optional[str] = None
    type: str  # INFLOW or OUTFLOW
    merchant: Optional[Dict[str, Any]] = None
    status: Optional[str] = None  # PENDING, PROCESSED, etc.
    subcategory: Optional[str] = None
    balance: Optional[float] = None
    reference: Optional[str] = None