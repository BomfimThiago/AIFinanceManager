/**
 * Date Formatter Hook - Locale-aware date formatting
 * Automatically formats dates based on user's selected language
 */

import { useTranslation } from '../contexts/LanguageContext';

export const useDateFormatter = () => {
  const { 
    formatDate, 
    formatShortDate, 
    formatLongDate, 
    formatDateTime, 
    formatRelativeDate,
    getLocale 
  } = useTranslation();

  return {
    /**
     * Format date with custom options
     * @param date - Date object or ISO string
     * @param options - Intl.DateTimeFormatOptions
     * @returns Formatted date string
     */
    formatDate,

    /**
     * Short date format based on locale
     * - English (US): 12/31/2023
     * - Spanish (ES): 31/12/2023  
     * - Portuguese (BR): 31/12/2023
     */
    formatShortDate,

    /**
     * Long date format based on locale
     * - English: December 31, 2023
     * - Spanish: 31 de diciembre de 2023
     * - Portuguese: 31 de dezembro de 2023
     */
    formatLongDate,

    /**
     * Date and time format based on locale
     * - English: 12/31/2023, 2:30 PM
     * - Spanish: 31/12/2023, 14:30
     * - Portuguese: 31/12/2023, 14:30
     */
    formatDateTime,

    /**
     * Relative date format based on locale
     * - English: 2 days ago, yesterday, now
     * - Spanish: hace 2 días, ayer, ahora
     * - Portuguese: há 2 dias, ontem, agora
     */
    formatRelativeDate,

    /**
     * Get current locale string
     * - en: en-US
     * - es: es-ES
     * - pt: pt-BR
     */
    getLocale,

    /**
     * Format date for form inputs (always YYYY-MM-DD)
     */
    formatForInput: (date: Date | string): string => {
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toISOString().split('T')[0];
      } catch (error) {
        console.warn('Date input formatting error:', error);
        return '';
      }
    },

    /**
     * Format month name based on locale
     * - English: January, February, ...
     * - Spanish: enero, febrero, ...
     * - Portuguese: janeiro, fevereiro, ...
     */
    formatMonth: (date: Date | string): string => {
      return formatDate(date, { month: 'long' });
    },

    /**
     * Format year
     */
    formatYear: (date: Date | string): string => {
      return formatDate(date, { year: 'numeric' });
    },

    /**
     * Format month and year
     * - English: January 2023
     * - Spanish: enero de 2023
     * - Portuguese: janeiro de 2023
     */
    formatMonthYear: (date: Date | string): string => {
      return formatDate(date, { month: 'long', year: 'numeric' });
    },
  };
};