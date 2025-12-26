import { ExpenseCategory } from '../types';

interface CategoryInfo {
  value: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { value: 'groceries', label: 'Groceries', icon: '🛒', color: '#22c55e' },
  { value: 'dining', label: 'Dining', icon: '🍽️', color: '#f97316' },
  { value: 'transportation', label: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { value: 'utilities', label: 'Utilities', icon: '💡', color: '#eab308' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#a855f7' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥', color: '#ef4444' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { value: 'housing', label: 'Housing', icon: '🏠', color: '#6366f1' },
  { value: 'education', label: 'Education', icon: '📚', color: '#14b8a6' },
  { value: 'travel', label: 'Travel', icon: '✈️', color: '#06b6d4' },
  { value: 'other', label: 'Other', icon: '📦', color: '#6b7280' },
];

export const getCategoryInfo = (category: ExpenseCategory): CategoryInfo => {
  return CATEGORIES.find((c) => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
};
