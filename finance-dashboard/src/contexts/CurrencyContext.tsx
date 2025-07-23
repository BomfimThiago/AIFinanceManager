import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Currency } from '../types';
import { getCurrencies, getExchangeRates } from '../services/apiService';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
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
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    return localStorage.getItem('selectedCurrency') || 'EUR';
  });
  const [currencies, setCurrencies] = useState<Record<string, Currency>>({});
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load currency information and exchange rates
  useEffect(() => {
    const loadCurrencyData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch currency information
        const currencyData = await getCurrencies();
        setCurrencies(currencyData.currencies);

        // Fetch exchange rates
        const ratesData = await getExchangeRates();
        setExchangeRates(ratesData.rates);
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

  // Save selected currency to localStorage
  useEffect(() => {
    localStorage.setItem('selectedCurrency', selectedCurrency);
  }, [selectedCurrency]);

  const formatAmount = (amount: number, currency?: string): string => {
    const currencyCode = currency || selectedCurrency;
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

  const convertAmount = (
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string
  ): number => {
    const targetCurrency = toCurrency || selectedCurrency;
    
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
    currencies,
    exchangeRates,
    isLoading,
    formatAmount,
    convertAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};