
import { LucideIcon } from 'lucide-react';

export interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  description: string;
  merchant: string;
  type: 'expense' | 'income';
  source?: 'ai-processed' | 'manual';
  items?: string[];
}

export interface Budget {
  limit: number;
  spent: number;
}

export interface Budgets {
  [category: string]: Budget;
}

export interface Category {
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface AIInsight {
  title: string;
  message: string;
  type: 'warning' | 'success' | 'info';
  actionable?: string;
}

export interface UploadedFile {
  file: File;
  status: 'processing' | 'completed' | 'error';
  expense?: Expense;
}

export type TabId = 'dashboard' | 'upload' | 'expenses' | 'budgets' | 'insights';