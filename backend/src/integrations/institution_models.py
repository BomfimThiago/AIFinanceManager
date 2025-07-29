"""
Institution models for integration providers.

This module contains SQLAlchemy models for institution data,
particularly for Belvo institutions with logo and metadata support.
"""

from enum import Enum

from sqlalchemy import JSON, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from src.database import Base


class BelvoInstitutionType(str, Enum):
    BANK = "bank"
    BUSINESS = "business"
    FISCAL = "fiscal"


class BelvoInstitutionStatus(str, Enum):
    HEALTHY = "healthy"
    DOWN = "down"
    MAINTENANCE = "maintenance"


class BelvoInstitution(Base):
    """SQLAlchemy model for Belvo institution data."""

    __tablename__ = "belvo_institutions"

    id = Column(Integer, primary_key=True, index=True)
    belvo_id = Column(Integer, unique=True, index=True, nullable=False)  # Belvo API ID
    name = Column(String(255), nullable=False, index=True)  # Internal name from Belvo
    display_name = Column(String(255), nullable=False)  # User-friendly display name
    code = Column(String(100), nullable=False, index=True)  # Institution code
    type = Column(String(50), nullable=False)  # BelvoInstitutionType
    status = Column(String(50), nullable=False)  # BelvoInstitutionStatus
    country_code = Column(String(2), nullable=False, index=True)  # Primary country
    country_codes = Column(JSON, nullable=False)  # All supported countries
    primary_color = Column(String(7), nullable=False)  # Hex color code
    logo = Column(String(500), nullable=True)  # Full logo URL
    icon_logo = Column(String(500), nullable=True)  # Icon version
    text_logo = Column(String(500), nullable=True)  # Text version
    website = Column(String(500), nullable=True)  # Institution website

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<BelvoInstitution(id={self.id}, belvo_id={self.belvo_id}, display_name='{self.display_name}')>"
