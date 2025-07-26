import logging
from enum import Enum
from typing import Dict, Optional

import aiohttp

logger = logging.getLogger(__name__)


class Currency(str, Enum):
    """Supported currencies."""

    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    BRL = "BRL"  # Brazilian Real


class CurrencyService:
    """Service for currency conversion and exchange rates."""

    BASE_URL = "https://api.frankfurter.dev/v1"

    # Currency display information
    CURRENCY_INFO = {
        Currency.USD: {"name": "US Dollar", "symbol": "$", "flag": "🇺🇸", "code": "USD"},
        Currency.EUR: {"name": "Euro", "symbol": "€", "flag": "🇪🇺", "code": "EUR"},
        Currency.BRL: {
            "name": "Brazilian Real",
            "symbol": "R$",
            "flag": "🇧🇷",
            "code": "BRL",
        },
    }

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        """Close the aiohttp session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def get_current_rates(
        self, base_currency: Currency = Currency.EUR
    ) -> Dict[str, float]:
        """
        Get current exchange rates for all supported currencies.

        Args:
            base_currency: The base currency for exchange rates

        Returns:
            Dictionary with currency codes as keys and exchange rates as values
        """
        try:
            session = await self._get_session()

            # Get all supported currencies except the base
            target_currencies = [c.value for c in Currency if c != base_currency]
            symbols = ",".join(target_currencies)

            url = f"{self.BASE_URL}/latest"
            params = {"from": base_currency.value, "to": symbols}

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    rates = data.get("rates", {})

                    # Add the base currency with rate 1.0
                    rates[base_currency.value] = 1.0

                    logger.info(f"Retrieved current rates: {rates}")
                    return rates
                else:
                    logger.error(f"Failed to get exchange rates: {response.status}")
                    return self._get_fallback_rates(base_currency)

        except Exception as e:
            logger.error(f"Error fetching exchange rates: {e}")
            return self._get_fallback_rates(base_currency)

    async def get_historical_rates(
        self, date: str, base_currency: Currency = Currency.EUR
    ) -> Dict[str, float]:
        """
        Get historical exchange rates for a specific date.

        Args:
            date: Date in YYYY-MM-DD format
            base_currency: The base currency for exchange rates

        Returns:
            Dictionary with currency codes as keys and exchange rates as values
        """
        try:
            session = await self._get_session()

            target_currencies = [c.value for c in Currency if c != base_currency]
            symbols = ",".join(target_currencies)

            url = f"{self.BASE_URL}/{date}"
            params = {"from": base_currency.value, "to": symbols}

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    rates = data.get("rates", {})

                    # Add the base currency with rate 1.0
                    rates[base_currency.value] = 1.0

                    logger.info(f"Retrieved historical rates for {date}: {rates}")
                    return rates
                else:
                    logger.error(
                        f"Failed to get historical rates for {date}: {response.status}"
                    )
                    # Fallback to current rates if historical data unavailable
                    return await self.get_current_rates(base_currency)

        except Exception as e:
            logger.error(f"Error fetching historical rates for {date}: {e}")
            return await self.get_current_rates(base_currency)

    async def convert_amount(
        self,
        amount: float,
        from_currency: Currency,
        to_currency: Currency,
        exchange_rates: Optional[Dict[str, float]] = None,
    ) -> float:
        """
        Convert amount from one currency to another.

        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currency: Target currency
            exchange_rates: Optional pre-fetched exchange rates

        Returns:
            Converted amount
        """
        if from_currency == to_currency:
            return amount

        if exchange_rates is None:
            exchange_rates = await self.get_current_rates()

        try:
            # Convert to base currency first (EUR), then to target currency
            if (
                from_currency.value not in exchange_rates
                or to_currency.value not in exchange_rates
            ):
                logger.error(
                    f"Missing exchange rate for {from_currency} or {to_currency}"
                )
                return amount  # Return original amount if conversion fails

            # If converting from base currency (EUR)
            if from_currency == Currency.EUR:
                return amount * exchange_rates[to_currency.value]

            # If converting to base currency (EUR)
            if to_currency == Currency.EUR:
                return amount / exchange_rates[from_currency.value]

            # Converting between two non-base currencies
            # First convert to EUR, then to target currency
            eur_amount = amount / exchange_rates[from_currency.value]
            return eur_amount * exchange_rates[to_currency.value]

        except Exception as e:
            logger.error(
                f"Error converting {amount} from {from_currency} to {to_currency}: {e}"
            )
            return amount

    async def convert_to_all_currencies(
        self,
        amount: float,
        from_currency: Currency,
        exchange_rates: Optional[Dict[str, float]] = None,
    ) -> Dict[str, float]:
        """
        Convert amount to all supported currencies.

        Args:
            amount: Amount to convert
            from_currency: Source currency
            exchange_rates: Optional pre-fetched exchange rates

        Returns:
            Dictionary with currency codes as keys and converted amounts as values
        """
        if exchange_rates is None:
            exchange_rates = await self.get_current_rates()

        converted_amounts = {}

        for currency in Currency:
            converted_amounts[currency.value] = await self.convert_amount(
                amount, from_currency, currency, exchange_rates
            )

        return converted_amounts

    def _get_fallback_rates(
        self, base_currency: Currency = Currency.EUR
    ) -> Dict[str, float]:
        """
        Get fallback exchange rates in case API is unavailable.
        These are approximate rates and should be updated periodically.
        """
        # Fallback rates based on approximate values (should be updated)
        # Note: These rates assume EUR as base currency regardless of the parameter
        fallback_rates = {
            Currency.EUR.value: 1.0,
            Currency.USD.value: 1.08,
            Currency.BRL.value: 6.15,
        }

        logger.warning(
            f"Using fallback exchange rates with base {base_currency.value}: {fallback_rates}"
        )
        return fallback_rates

    def detect_currency_from_text(self, text: str) -> Currency:
        """
        Detect currency from text based on symbols and currency codes.

        Args:
            text: Text to analyze for currency indicators

        Returns:
            Detected currency (defaults to EUR if none detected)
        """
        text_upper = text.upper()

        # Check for currency codes
        if "USD" in text_upper or "$" in text:
            return Currency.USD
        elif "BRL" in text_upper or "R$" in text or "REAL" in text_upper:
            return Currency.BRL
        elif "EUR" in text_upper or "€" in text or "EURO" in text_upper:
            return Currency.EUR

        # Default to EUR if no currency detected
        logger.info("No currency detected in text, defaulting to EUR")
        return Currency.EUR

    def get_currency_info(self, currency: Currency) -> Dict[str, str]:
        """Get display information for a currency."""
        return self.CURRENCY_INFO.get(currency, {})

    def get_all_currencies_info(self) -> Dict[str, Dict[str, str]]:
        """Get display information for all supported currencies."""
        return {currency.value: info for currency, info in self.CURRENCY_INFO.items()}


# Global currency service instance
currency_service = CurrencyService()
