import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { getCurrencies, getExchangeRates, getAuthToken } from '../services/apiService';
import type { Currency } from '../types';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  sessionCurrency: string;
  setSessionCurrency: (currency: string) => void;
  currencies: Record<string, Currency>;
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  formatAmount: (amount: number, currency?: string) => string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // User's saved preference (from database/preferences)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR');

  // Session-only currency for temporary viewing (not saved to database)
  const [sessionCurrency, setSessionCurrency] = useState<string>(() => {
    // First try sessionStorage (if user changed it during this session)
    const sessionStorageCurrency = sessionStorage.getItem('sessionCurrency');
    if (sessionStorageCurrency) {
      return sessionStorageCurrency;
    }
    // Otherwise use the selectedCurrency (user's preference)
    return 'EUR'; // Will be updated when selectedCurrency loads
  });

  const [currencies, setCurrencies] = useState<Record<string, Currency>>({});
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load currency information and exchange rates
  useEffect(() => {
    const loadCurrencyData = async () => {
      const isAuthenticated = !!getAuthToken();
      
      try {
        setIsLoading(true);

        // If authenticated, fetch from API
        if (isAuthenticated) {
          // Fetch currency information
          const currencyData = await getCurrencies();
          setCurrencies(currencyData.currencies);

          // Fetch exchange rates
          const ratesData = await getExchangeRates();
          setExchangeRates(ratesData.rates);
        } else {
          // Use fallback data for unauthenticated state
          setCurrencies({
            USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
            EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
            BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
          });
          setExchangeRates({ USD: 1.08, EUR: 1.0, BRL: 6.15 });
        }
      } catch (error) {
        console.error('Error loading currency data:', error);
        // Set fallback data
        setCurrencies({
          USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
          EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
          BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
        });
        setExchangeRates({ USD: 1.08, EUR: 1.0, BRL: 6.15 });
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrencyData();
  }, []);

  // Initialize sessionCurrency with selectedCurrency if no session override exists
  useEffect(() => {
    const sessionStorageCurrency = sessionStorage.getItem('sessionCurrency');
    if (!sessionStorageCurrency && selectedCurrency) {
      setSessionCurrency(selectedCurrency);
    }
  }, [selectedCurrency]);

  // Save session currency to sessionStorage (temporary)
  useEffect(() => {
    sessionStorage.setItem('sessionCurrency', sessionCurrency);
  }, [sessionCurrency]);

  const formatAmount = (amount: number, currency?: string): string => {
    // Handle undefined, null, or invalid amounts
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00';
    }

    const currencyCode = currency || sessionCurrency;
    const currencyInfo = currencies[currencyCode];

    if (!currencyInfo) {
      return amount.toFixed(2);
    }

    // Format number with appropriate decimal places
    const formattedNumber = amount.toFixed(2);

    // Return with currency symbol
    if (currencyCode === 'BRL') {
      return `${currencyInfo.symbol} ${formattedNumber}`;
    } else {
      return `${currencyInfo.symbol}${formattedNumber}`;
    }
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    const targetCurrency = toCurrency || sessionCurrency;

    if (fromCurrency === targetCurrency) {
      return amount;
    }

    // If we don't have exchange rates, return original amount
    if (!exchangeRates[fromCurrency] || !exchangeRates[targetCurrency]) {
      return amount;
    }

    // Convert via EUR (base currency)
    if (fromCurrency === 'EUR') {
      return amount * exchangeRates[targetCurrency];
    } else if (targetCurrency === 'EUR') {
      return amount / exchangeRates[fromCurrency];
    } else {
      // Convert from source to EUR, then to target
      const eurAmount = amount / exchangeRates[fromCurrency];
      return eurAmount * exchangeRates[targetCurrency];
    }
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    setSelectedCurrency,
    sessionCurrency,
    setSessionCurrency,
    currencies,
    exchangeRates,
    isLoading,
    formatAmount,
    convertAmount,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
