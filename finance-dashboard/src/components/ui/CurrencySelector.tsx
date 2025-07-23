import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

const CurrencySelector: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency, currencies, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const selectedCurrencyInfo = currencies[selectedCurrency];
  const supportedCurrencies = ['USD', 'EUR', 'BRL'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <span className="text-lg">{selectedCurrencyInfo?.flag || '🇪🇺'}</span>
        <span className="font-medium text-gray-700">{selectedCurrency}</span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {supportedCurrencies.map((currencyCode) => {
              const currency = currencies[currencyCode];
              if (!currency) return null;

              const isSelected = currencyCode === selectedCurrency;

              return (
                <button
                  key={currencyCode}
                  onClick={() => {
                    setSelectedCurrency(currencyCode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{currency.flag}</span>
                    <div>
                      <div className="font-medium text-gray-900">{currencyCode}</div>
                      <div className="text-sm text-gray-500">{currency.name}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;