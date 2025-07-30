/**
 * Currency conversion utility functions
 */

import { Expense } from '../types';

/**
 * Get the converted amount for an expense in the specified currency.
 * 
 * @param expense - The expense object
 * @param targetCurrency - The currency to convert to (usually sessionCurrency for display)
 * @param convertAmount - The conversion function from CurrencyContext
 * @returns The amount in the target currency
 */
export const getExpenseAmountInCurrency = (
  expense: Expense,
  targetCurrency: string,
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number
): number => {
  // 1. First check if we have pre-calculated amounts for the target currency
  if (expense.amounts && expense.amounts[targetCurrency] !== undefined) {
    return expense.amounts[targetCurrency];
  }

  // 2. If no pre-calculated amount, do real-time conversion
  const originalCurrency = expense.original_currency || 'EUR';
  return convertAmount(expense.amount, originalCurrency, targetCurrency);
};

/**
 * Check if an expense has accurate currency data
 */
export const hasValidCurrencyData = (expense: Expense): boolean => {
  return !!(expense.original_currency && expense.amount);
};

/**
 * Get a display string for currency conversion info
 */
export const getCurrencyConversionInfo = (
  expense: Expense,
  targetCurrency: string
): string | null => {
  if (!expense.original_currency || expense.original_currency === targetCurrency) {
    return null; // No conversion needed
  }

  const hasPreCalculated = expense.amounts && expense.amounts[targetCurrency] !== undefined;
  const conversionSource = hasPreCalculated ? 'stored rate' : 'current rate';
  
  return `Converted from ${expense.original_currency} (${conversionSource})`;
};