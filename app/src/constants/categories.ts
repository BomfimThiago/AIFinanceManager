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
  { value: 'rent', label: 'Rent', icon: '🔑', color: '#8b5cf6' },
  { value: 'energy', label: 'Energy/Power', icon: '⚡', color: '#fbbf24' },
  { value: 'internet', label: 'Internet', icon: '📶', color: '#0ea5e9' },
  { value: 'insurance', label: 'Insurance', icon: '🛡️', color: '#64748b' },
  { value: 'subscriptions', label: 'Subscriptions', icon: '🔄', color: '#f43f5e' },
  { value: 'other_expense', label: 'Other Expense', icon: '📦', color: '#6b7280' },
  { value: 'other', label: 'Other', icon: '📦', color: '#6b7280' },
];

// Map for quick lookup including any dynamic categories
const categoryMap = new Map(CATEGORIES.map(c => [c.value, c]));

export const getCategoryInfo = (category: string): CategoryInfo => {
  return categoryMap.get(category as ExpenseCategory) || CATEGORIES[CATEGORIES.length - 1];
};
