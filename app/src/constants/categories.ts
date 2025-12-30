import { ExpenseCategory } from '../types';

interface CategoryInfo {
  value: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { value: 'groceries', label: 'Supermercado', icon: '🛒', color: '#22c55e' },
  { value: 'dining', label: 'Restaurantes', icon: '🍽️', color: '#f97316' },
  { value: 'transportation', label: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { value: 'utilities', label: 'Servicios', icon: '💡', color: '#eab308' },
  { value: 'entertainment', label: 'Entretenimiento', icon: '🎬', color: '#a855f7' },
  { value: 'healthcare', label: 'Salud', icon: '🏥', color: '#ef4444' },
  { value: 'shopping', label: 'Compras', icon: '🛍️', color: '#ec4899' },
  { value: 'housing', label: 'Vivienda', icon: '🏠', color: '#6366f1' },
  { value: 'education', label: 'Educación', icon: '📚', color: '#14b8a6' },
  { value: 'travel', label: 'Viajes', icon: '✈️', color: '#06b6d4' },
  { value: 'rent', label: 'Alquiler', icon: '🔑', color: '#8b5cf6' },
  { value: 'energy', label: 'Energía', icon: '⚡', color: '#fbbf24' },
  { value: 'internet', label: 'Internet', icon: '📶', color: '#0ea5e9' },
  { value: 'insurance', label: 'Seguros', icon: '🛡️', color: '#64748b' },
  { value: 'subscriptions', label: 'Suscripciones', icon: '🔄', color: '#f43f5e' },
  { value: 'other_expense', label: 'Otro Gasto', icon: '📦', color: '#6b7280' },
  { value: 'other', label: 'Otro', icon: '📦', color: '#6b7280' },
];

// Map for quick lookup including any dynamic categories
const categoryMap = new Map(CATEGORIES.map(c => [c.value, c]));

export const getCategoryInfo = (category: string): CategoryInfo => {
  return categoryMap.get(category as ExpenseCategory) || CATEGORIES[CATEGORIES.length - 1];
};
