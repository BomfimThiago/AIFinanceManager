from typing import Optional, List
from pydantic import BaseModel
from enum import Enum


class BelvoInstitutionType(str, Enum):
    BANK = "bank"
    BUSINESS = "business"
    FISCAL = "fiscal"


class BelvoInstitutionStatus(str, Enum):
    HEALTHY = "healthy"
    DOWN = "down"
    MAINTENANCE = "maintenance"


class BelvoInstitution(BaseModel):
    """Pydantic model for Belvo institution data."""
    id: int
    belvo_id: int  # The actual ID from Belvo API
    name: str  # Internal name from Belvo
    display_name: str  # User-friendly display name
    code: str  # Institution code
    type: BelvoInstitutionType
    status: BelvoInstitutionStatus
    country_code: str  # Primary country code
    country_codes: List[str]  # All supported country codes
    primary_color: str  # Hex color code for branding
    logo: Optional[str] = None  # Full logo URL
    icon_logo: Optional[str] = None  # Icon version of logo
    text_logo: Optional[str] = None  # Text version of logo
    website: Optional[str] = None  # Institution website


class BelvoInstitutionCreate(BaseModel):
    """Pydantic model for creating a Belvo institution."""
    belvo_id: int
    name: str
    display_name: str
    code: str
    type: BelvoInstitutionType
    status: BelvoInstitutionStatus
    country_code: str
    country_codes: List[str]
    primary_color: str
    logo: Optional[str] = None
    icon_logo: Optional[str] = None
    text_logo: Optional[str] = None
    website: Optional[str] = None


class BelvoInstitutionUpdate(BaseModel):
    """Pydantic model for updating a Belvo institution."""
    name: Optional[str] = None
    display_name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[BelvoInstitutionType] = None
    status: Optional[BelvoInstitutionStatus] = None
    country_code: Optional[str] = None
    country_codes: Optional[List[str]] = None
    primary_color: Optional[str] = None
    logo: Optional[str] = None
    icon_logo: Optional[str] = None
    text_logo: Optional[str] = None
    website: Optional[str] = None