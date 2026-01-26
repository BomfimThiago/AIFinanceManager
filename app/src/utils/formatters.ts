import { Currency } from '../types';

export function formatCurrency(amount: number | string | null | undefined, currency: Currency = 'USD'): string {
  // Defensive conversion: API may return strings instead of numbers
  const numericAmount = Number(amount) || 0;
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(numericAmount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
