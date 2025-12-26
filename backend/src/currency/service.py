import logging
from datetime import datetime
from decimal import Decimal
from typing import TypedDict

import httpx

from src.core.logging import log_error, log_info

logger = logging.getLogger(__name__)

# Supported currencies
SUPPORTED_CURRENCIES = ["USD", "EUR", "BRL"]


class ConvertedAmounts(TypedDict):
    amount_usd: Decimal
    amount_eur: Decimal
    amount_brl: Decimal


class CurrencyRatesNotAvailableError(Exception):
    """Raised when currency rates are not available."""

    pass


class CurrencyService:
    """Service for fetching exchange rates and converting currencies.

    Rates are fetched daily at 9:00 UTC by a scheduled job and cached.
    All conversions use the cached daily rates.
    """

    BASE_URL = "https://api.frankfurter.app"

    def __init__(self):
        # Daily rates cache: {base_currency: {target_currency: rate}}
        self._daily_rates: dict[str, dict[str, float]] = {}
        self._rates_date: str | None = None

    @property
    def has_rates(self) -> bool:
        """Check if rates are cached."""
        return bool(self._daily_rates)

    async def fetch_daily_rates(self) -> None:
        """Fetch latest exchange rates for all supported currencies.

        This method is called by the scheduler at 9:00 UTC daily.
        """
        today = datetime.utcnow().strftime("%Y-%m-%d")
        log_info("Fetching daily exchange rates", date=today)

        try:
            async with httpx.AsyncClient() as client:
                for base_currency in SUPPORTED_CURRENCIES:
                    target_currencies = [c for c in SUPPORTED_CURRENCIES if c != base_currency]

                    url = f"{self.BASE_URL}/latest"
                    params = {
                        "from": base_currency,
                        "to": ",".join(target_currencies),
                    }

                    response = await client.get(url, params=params, timeout=10.0)
                    response.raise_for_status()

                    data = response.json()
                    rates = data.get("rates", {})

                    # Add self-rate
                    rates[base_currency] = 1.0

                    self._daily_rates[base_currency] = rates

                self._rates_date = today

                log_info(
                    "Daily exchange rates cached successfully",
                    date=today,
                    rates=self._daily_rates,
                )

        except httpx.HTTPStatusError as e:
            log_error(
                "Failed to fetch daily exchange rates",
                error=str(e),
                status_code=e.response.status_code,
            )
            raise CurrencyRatesNotAvailableError(
                f"Failed to fetch exchange rates: HTTP {e.response.status_code}"
            )

        except Exception as e:
            log_error(
                "Error fetching daily exchange rates",
                error=str(e),
            )
            raise CurrencyRatesNotAvailableError(
                f"Failed to fetch exchange rates: {str(e)}"
            )

    def get_rates(self, base_currency: str) -> dict[str, float]:
        """Get cached rates for a base currency.

        Raises CurrencyRatesNotAvailableError if rates haven't been fetched.
        """
        if not self._daily_rates:
            raise CurrencyRatesNotAvailableError(
                "Exchange rates not available. Rates are fetched daily at 9:00 UTC. "
                "Please try again later or contact support."
            )

        base = base_currency.upper()
        if base not in self._daily_rates:
            raise CurrencyRatesNotAvailableError(
                f"Exchange rates for {base} not available."
            )

        return self._daily_rates[base]

    async def convert_amount(
        self,
        amount: Decimal,
        from_currency: str,
        expense_date: datetime,  # kept for API compatibility, but we use daily rates
    ) -> ConvertedAmounts:
        """Convert an amount to all supported currencies using daily cached rates.

        Raises CurrencyRatesNotAvailableError if rates haven't been fetched.
        """
        rates = self.get_rates(from_currency)

        amount_float = float(amount)

        result: ConvertedAmounts = {
            "amount_usd": Decimal(str(round(amount_float * rates.get("USD", 1.0), 2))),
            "amount_eur": Decimal(str(round(amount_float * rates.get("EUR", 1.0), 2))),
            "amount_brl": Decimal(str(round(amount_float * rates.get("BRL", 1.0), 2))),
        }

        log_info(
            "Converted amount",
            original_amount=str(amount),
            from_currency=from_currency,
            rates_date=self._rates_date,
            converted=result,
        )

        return result


# Singleton instance
_currency_service: CurrencyService | None = None


def get_currency_service() -> CurrencyService:
    global _currency_service
    if _currency_service is None:
        _currency_service = CurrencyService()
    return _currency_service
