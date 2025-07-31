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
  // Multi-currency support
  original_currency?: string;
  amounts?: Record<string, number>;
  exchange_rates?: Record<string, number>;
  exchange_date?: string;
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

export interface UploadHistory {
  id: number;
  filename: string;
  file_size: number;
  status: 'processing' | 'success' | 'failed';
  upload_date: string;
  error_message?: string;
}

export type TabId =
  | 'dashboard'
  | 'upload'
  | 'expenses'
  | 'budgets'
  | 'categories'
  | 'insights'
  | 'integrations';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface CurrencyInfo {
  currencies: Record<string, Currency>;
  supported: string[];
}

export interface ExchangeRates {
  rates: Record<string, number>;
  base_currency: string;
  timestamp: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  full_name: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}
