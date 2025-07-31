import {
  Car,
  DollarSign,
  Gamepad2,
  Home,
  MoreHorizontal,
  Plus,
  ShoppingCart,
  Utensils,
} from 'lucide-react';

import { Category } from '../types';

export const categories: Category[] = [
  { name: 'Groceries', icon: ShoppingCart, color: '#10B981' },
  { name: 'Utilities', icon: Home, color: '#3B82F6' },
  { name: 'Transport', icon: Car, color: '#8B5CF6' },
  { name: 'Dining', icon: Utensils, color: '#F59E0B' },
  { name: 'Entertainment', icon: Gamepad2, color: '#EF4444' },
  { name: 'Healthcare', icon: Plus, color: '#EC4899' },
  { name: 'Other', icon: MoreHorizontal, color: '#6B7280' },
  { name: 'Income', icon: DollarSign, color: '#059669' },
];

export const CHART_COLORS: string[] = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
];
