"""
Currency constants and enums.

This module contains currency-related constants and enumerations.
"""

from enum import Enum


class Currency(str, Enum):
    """Supported currencies."""

    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    BRL = "BRL"  # Brazilian Real


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
