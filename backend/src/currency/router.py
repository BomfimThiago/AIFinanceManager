"""
Currency router module.

This module contains the FastAPI router with currency-related endpoints.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from .constants import Currency
from .schemas import (
    ConvertAmountRequest,
    ConvertAmountResponse,
    CurrenciesResponse,
    CurrencyInfo,
    ExchangeRatesResponse,
)
from .service import currency_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Currency"])


@router.get("/currencies", response_model=CurrenciesResponse)
async def get_currencies() -> CurrenciesResponse:
    """Get information about all supported currencies."""
    try:
        currencies_info = currency_service.get_all_currencies_info()

        # Convert to CurrencyInfo objects
        currencies = {}
        for code, info in currencies_info.items():
            currencies[code] = CurrencyInfo(**info)

        return CurrenciesResponse(currencies=currencies)

    except Exception as e:
        logger.error(f"Error getting currencies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get currency information",
        )


@router.get("/exchange-rates", response_model=ExchangeRatesResponse)
async def get_exchange_rates(base_currency: str = "EUR") -> ExchangeRatesResponse:
    """Get current exchange rates for all supported currencies."""
    try:
        # Validate base currency
        try:
            base_curr = Currency(base_currency.upper())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported base currency: {base_currency}",
            )

        rates = await currency_service.get_current_rates(base_curr)

        return ExchangeRatesResponse(
            base_currency=base_curr.value,
            rates=rates,
            timestamp=datetime.utcnow().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exchange rates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get exchange rates",
        )


@router.post("/convert-amount", response_model=ConvertAmountResponse)
async def convert_amount(request: ConvertAmountRequest) -> ConvertAmountResponse:
    """Convert amount from one currency to another."""
    try:
        # Validate currencies
        try:
            from_curr = Currency(request.from_currency.upper())
            to_curr = Currency(request.to_currency.upper())
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid currency code: {e!s}",
            )

        # Get current rates and convert
        rates = await currency_service.get_current_rates()
        converted_amount = await currency_service.convert_amount(
            request.amount, from_curr, to_curr, rates
        )

        # Calculate exchange rate
        if from_curr == to_curr:
            exchange_rate = 1.0
        else:
            exchange_rate = (
                converted_amount / request.amount if request.amount != 0 else 0.0
            )

        return ConvertAmountResponse(
            original_amount=request.amount,
            converted_amount=converted_amount,
            from_currency=from_curr.value,
            to_currency=to_curr.value,
            exchange_rate=exchange_rate,
            timestamp=datetime.utcnow().isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting amount: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to convert amount",
        )
