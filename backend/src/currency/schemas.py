"""
Currency Pydantic schemas.

This module contains Pydantic models for currency-related data.
"""

from pydantic import Field

from src.shared.models import CustomModel


class CurrencyInfo(CustomModel):
    """Currency information schema."""

    name: str = Field(description="Currency full name")
    symbol: str = Field(description="Currency symbol")
    flag: str = Field(description="Currency flag emoji")
    code: str = Field(description="Currency code")


class CurrenciesResponse(CustomModel):
    """Response model for all currencies information."""

    currencies: dict[str, CurrencyInfo] = Field(
        description="Dictionary of all currencies"
    )


class ExchangeRatesResponse(CustomModel):
    """Response model for exchange rates."""

    base_currency: str = Field(description="Base currency code")
    rates: dict[str, float] = Field(description="Exchange rates dictionary")
    timestamp: str = Field(description="Timestamp of rates")


class ConvertAmountRequest(CustomModel):
    """Request model for amount conversion."""

    amount: float = Field(description="Amount to convert")
    from_currency: str = Field(description="Source currency code")
    to_currency: str = Field(description="Target currency code")


class ConvertAmountResponse(CustomModel):
    """Response model for amount conversion."""

    original_amount: float = Field(description="Original amount")
    converted_amount: float = Field(description="Converted amount")
    from_currency: str = Field(description="Source currency code")
    to_currency: str = Field(description="Target currency code")
    exchange_rate: float = Field(description="Exchange rate used")
    timestamp: str = Field(description="Conversion timestamp")
