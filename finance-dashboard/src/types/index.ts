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

// === GOALS SYSTEM (New Unified System) ===

export type GoalType = 'spending' | 'saving' | 'debt';
export type TimeHorizon = 'short' | 'medium' | 'long';
export type GoalRecurrence = 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface Goal {
  id: number;
  title: string;
  description?: string;
  goal_type: GoalType;
  time_horizon: TimeHorizon;
  recurrence: GoalRecurrence;
  status: GoalStatus;
  target_amount: number;
  current_amount: number;
  category?: string; // For spending goals
  target_date?: string;
  start_date: string;
  priority: 1 | 2 | 3; // 1=high, 2=medium, 3=low
  auto_calculate: boolean;
  color?: string; // Goal color for visual identification
  icon?: string; // Goal icon name for visual identification
  created_at: string;
  updated_at: string;
  // Computed properties
  progress_percentage: number;
  is_completed: boolean;
  remaining_amount: number;
}

export interface GoalCreate {
  title: string;
  description?: string;
  goal_type: GoalType;
  time_horizon: TimeHorizon;
  recurrence: GoalRecurrence;
  target_amount: number;
  contribution_amount?: number; // Amount to save/pay per recurrence period
  category?: string;
  target_date?: string;
  priority: 1 | 2 | 3;
  auto_calculate: boolean;
  color?: string; // Goal color for visual identification
  icon?: string; // Goal icon name for visual identification
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  target_amount?: number;
  contribution_amount?: number;
  current_amount?: number;
  target_date?: string;
  priority?: 1 | 2 | 3;
  status?: GoalStatus;
  auto_calculate?: boolean;
  color?: string; // Goal color for visual identification
  icon?: string; // Goal icon name for visual identification
}

export interface GoalProgress {
  goal_id: number;
  amount: number;
  date?: string;
  notes?: string;
}

export interface GoalSummary {
  total_goals: number;
  spending_goals: number;
  saving_goals: number;
  debt_goals: number;
  completed_goals: number;
  total_target: number;
  total_progress: number;
  overall_progress_percentage: number;
  goals_by_type: Record<GoalType, Goal[]>;
  goals_by_priority: Record<1 | 2 | 3, Goal[]>;
}

export interface GoalTemplate {
  template_type: 'monthly_budget' | 'emergency_fund' | 'vacation_fund' | 'debt_payoff';
  category?: string;
  amount: number;
  months?: number;
}

// === LEGACY BUDGET SYSTEM (Backward Compatibility) ===

export interface Budget {
  id?: number;
  category: string;
  limit: number;
  spent: number;
  period?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budgets {
  [category: string]: Budget;
}

export interface BudgetSummary {
  total_budgets: number;
  total_limit: number;
  total_spent: number;
  categories: Record<string, Budget>;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  icon: string; // Icon name as string (e.g., 'utensils', 'car', 'shopping-bag')
  color: string;
  category_type?: 'expense' | 'income';
  is_default?: boolean;
  is_active?: boolean;
  user_id?: number;
  translations?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  };
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

export type TabId = 'overview' | 'upload' | 'goals' | 'categories' | 'insights' | 'integrations';

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
