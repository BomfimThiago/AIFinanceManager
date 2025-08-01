import {
  AIInsight,
  AuthToken,
  Budgets,
  CurrencyInfo,
  ExchangeRates,
  Expense,
  Goal,
  GoalCreate,
  GoalUpdate,
  LoginCredentials,
  SignupCredentials,
  UploadHistory,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = (): string | null => authToken;

// Generic API request function with authentication
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);

  // Add authorization header if token exists
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  // Conditionally set Content-Type header
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 unauthorized - token might be expired
    if (response.status === 401) {
      // For auth endpoints like /api/auth/me, just clear token and continue
      if (endpoint.includes('/api/auth/me')) {
        setAuthToken(null);
        throw new Error('Token expired');
      }
      // For other endpoints, clear token and redirect
      else if (!endpoint.includes('/api/auth/')) {
        setAuthToken(null);
        window.location.href = '/login';
        throw new Error('Unauthorized - please login again');
      }
      // For login/signup endpoints, let the normal error handling process the response
    }

    if (!response.ok) {
      let errorData: any = null;
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

      try {
        errorData = await response.json();
        if (errorData.detail) {
          // Handle new structured error format
          if (typeof errorData.detail === 'object' && errorData.detail.error) {
            errorMessage = errorData.detail.error;
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }

      // Create error object with response data for better error handling
      const error = new Error(errorMessage) as any;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      };
      throw error;
    }

    // Handle empty response body
    const responseText = await response.text();
    if (!responseText) {
      return {} as T;
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Expense API calls
export const expenseApi = {
  getAll: (filters?: {
    month?: number;
    year?: number;
    type?: string;
    category?: string;
    categories?: string[];
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.month && filters.month > 0) {
      params.append('month', filters.month.toString());
    }
    if (filters?.year && filters.year > 0) {
      params.append('year', filters.year.toString());
    }
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.categories && filters.categories.length > 0) {
      // Add multiple category parameters: ?category=TECH&category=TRANSPORT
      filters.categories.forEach(cat => {
        params.append('category', cat);
      });
    } else if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/api/expenses?${queryString}` : '/api/expenses';

    return apiRequest<Expense[]>(endpoint);
  },

  create: (expense: Omit<Expense, 'id'>): Promise<Expense> =>
    apiRequest<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  createBulk: (expenses: Omit<Expense, 'id'>[]): Promise<Expense[]> =>
    apiRequest<Expense[]>('/api/expenses/bulk', {
      method: 'POST',
      body: JSON.stringify(expenses),
    }),

  uploadFile: async (file: File): Promise<Expense[]> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<Expense[]>('/api/expenses/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getSummary: (): Promise<{
    total_income: number;
    total_expenses: number;
    net_amount: number;
    category_spending: Record<string, number>;
  }> => apiRequest('/api/expenses/summary'),

  getCategoriesChart: (): Promise<Array<{ name: string; value: number; color: string }>> =>
    apiRequest('/api/expenses/charts/categories'),

  getMonthlyChart: (): Promise<Array<{ month: string; income: number; expenses: number }>> =>
    apiRequest('/api/expenses/charts/monthly'),

  getCategorySpending: (
    params: { currency?: string; month?: number; year?: number } = {}
  ): Promise<{
    currency: string;
    category_spending: Record<string, number>;
  }> => {
    const searchParams = new URLSearchParams();
    if (params.currency) {
      searchParams.append('currency', params.currency);
    }
    if (params.month && params.month > 0) {
      searchParams.append('month', params.month.toString());
    }
    if (params.year && params.year > 0) {
      searchParams.append('year', params.year.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/expenses/category-spending?${queryString}`
      : '/api/expenses/category-spending';

    return apiRequest(endpoint);
  },

  update: (expenseId: number, expense: Omit<Expense, 'id'>): Promise<Expense> =>
    apiRequest<Expense>(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    }),

  delete: (expenseId: number): Promise<{ message: string }> =>
    apiRequest(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
};

// Budget API calls
export const budgetApi = {
  getAll: (): Promise<Record<string, { limit: number; spent: number }>> =>
    apiRequest('/api/budgets'),

  create: (budget: {
    category: string;
    limit: number;
  }): Promise<{ limit: number; spent: number }> =>
    apiRequest('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    }),

  updateSpent: (category: string, amount: number): Promise<{ limit: number; spent: number }> =>
    apiRequest(`/api/budgets/${category}/spent`, {
      method: 'PUT',
      body: JSON.stringify(amount),
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  delete: (category: string): Promise<{ message: string }> =>
    apiRequest(`/api/budgets/${category}`, {
      method: 'DELETE',
    }),
};

// AI Insights API calls
export const insightsApi = {
  generate: (): Promise<AIInsight[]> =>
    apiRequest('/api/insights/generate', {
      method: 'POST',
    }),
};

// Legacy functions for backward compatibility
export const processFileWithAI = async (file: File): Promise<Expense[] | null> => {
  try {
    return await expenseApi.uploadFile(file);
  } catch (error) {
    console.error('Error processing file with AI:', error);
    return null;
  }
};

export const generateAIInsights = async (
  _expenses: Expense[],
  _budgets: Budgets
): Promise<AIInsight[]> => {
  try {
    return await insightsApi.generate();
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [];
  }
};

// Currency API functions
export const getCurrencies = async (): Promise<CurrencyInfo> => {
  const response = await apiRequest<{
    currencies: Record<string, { name: string; symbol: string; flag: string; code: string }>;
  }>('/api/currencies');
  return {
    currencies: response.currencies,
    supported: Object.keys(response.currencies),
  };
};

export const getExchangeRates = async (): Promise<ExchangeRates> => {
  return apiRequest<ExchangeRates>('/api/exchange-rates');
};

// Authentication API calls
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const response = await apiRequest<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Handle new auth response structure
    if (response.success && response.token) {
      setAuthToken(response.token.access_token);
      return {
        access_token: response.token.access_token,
        refresh_token: response.token.refresh_token,
        token_type: response.token.token_type,
        expires_in: response.token.expires_in,
        user: response.token.user,
      };
    }
    throw new Error(response.message || 'Login failed');
  },

  signup: async (credentials: SignupCredentials): Promise<AuthToken> => {
    const response = await apiRequest<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        terms_accepted: true,
      }),
    });

    // Handle new auth response structure
    if (response.success && response.user) {
      // For registration, we need to login separately
      return await authApi.login({
        email: credentials.email,
        password: credentials.password,
      });
    }
    throw new Error(response.message || 'Registration failed');
  },

  logout: (): void => {
    setAuthToken(null);
  },

  getCurrentUser: (): Promise<User> => apiRequest<User>('/api/auth/me'),

  refreshToken: (refreshToken: string): Promise<AuthToken> =>
    apiRequest<AuthToken>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
};

// Upload History API
export const uploadHistoryApi = {
  getAll: (): Promise<UploadHistory[]> => apiRequest<UploadHistory[]>('/api/upload-history/'),

  delete: (uploadId: number): Promise<{ message: string }> =>
    apiRequest<{ message: string }>(`/api/upload-history/${uploadId}`, {
      method: 'DELETE',
    }),
};

// Category API
export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_default: boolean;
  is_active: boolean;
  user_id?: number;
  translations?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  };
  created_at: string;
  updated_at: string;
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
}

export interface CategoryCreate {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export const categoryApi = {
  getAll: (include_default: boolean = true): Promise<CategoryListResponse> =>
    apiRequest<CategoryListResponse>(`/api/categories/?include_default=${include_default}`),

  create: (category: CategoryCreate): Promise<Category> =>
    apiRequest<Category>('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(category),
    }),

  update: (id: number, category: CategoryUpdate): Promise<Category> =>
    apiRequest<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),

  delete: (id: number): Promise<void> =>
    apiRequest<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),

  getStats: (): Promise<any> => apiRequest<any>('/api/categories/stats'),

  getNames: (): Promise<string[]> => apiRequest<string[]>('/api/categories/names'),

  addPreference: (accountName: string, categoryName: string): Promise<any> =>
    apiRequest<any>(`/api/categories/preferences/${accountName}/${categoryName}`, {
      method: 'POST',
    }),
};

// User Preferences API
export interface UserPreferences {
  id: number;
  user_id: number;
  default_currency: 'USD' | 'EUR' | 'BRL';
  language: 'en' | 'es' | 'pt';
  ui_preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesResponse {
  preferences: UserPreferences;
  available_currencies: string[];
  available_languages: Array<{
    code: string;
    label: string;
    native_label: string;
  }>;
}

export interface UserPreferencesUpdate {
  default_currency?: 'USD' | 'EUR' | 'BRL';
  language?: 'en' | 'es' | 'pt';
  ui_preferences?: Record<string, any>;
}

export const userPreferencesApi = {
  get: (): Promise<UserPreferencesResponse> =>
    apiRequest<UserPreferencesResponse>('/api/user/preferences/'),

  update: (preferences: UserPreferencesUpdate): Promise<UserPreferences> =>
    apiRequest<UserPreferences>('/api/user/preferences/', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  updateCurrency: (currency: string): Promise<UserPreferences> =>
    apiRequest<UserPreferences>(`/api/user/preferences/currency/${currency}`, {
      method: 'PUT',
    }),

  updateLanguage: (language: string): Promise<UserPreferences> =>
    apiRequest<UserPreferences>(`/api/user/preferences/language/${language}`, {
      method: 'PUT',
    }),

  updateUI: (uiPreferences: Record<string, any>): Promise<UserPreferences> =>
    apiRequest<UserPreferences>('/api/user/preferences/ui', {
      method: 'PUT',
      body: JSON.stringify(uiPreferences),
    }),
};

// Goals API
export interface GoalsListResponse {
  goals: Goal[];
}

export const goalsApi = {
  getAll: (): Promise<Goal[]> =>
    apiRequest<Goal[]>('/api/goals'),

  getById: (id: number): Promise<Goal> =>
    apiRequest<Goal>(`/api/goals/${id}`),

  create: (goal: GoalCreate): Promise<Goal> =>
    apiRequest<Goal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    }),

  update: (id: number, goal: GoalUpdate): Promise<Goal> =>
    apiRequest<Goal>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    }),

  delete: (id: number): Promise<void> =>
    apiRequest<void>(`/api/goals/${id}`, {
      method: 'DELETE',
    }),

  getByType: (goalType: string): Promise<Goal[]> =>
    apiRequest<Goal[]>(`/api/goals?goal_type=${goalType}`),

  getActive: (): Promise<Goal[]> =>
    apiRequest<Goal[]>('/api/goals?status=active'),

  getSummary: (): Promise<any> =>
    apiRequest<any>('/api/goals/summary'),

  updateProgress: (id: number, progress: { amount: number; date?: string; notes?: string }): Promise<Goal> =>
    apiRequest<Goal>(`/api/goals/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(progress),
    }),

  setProgress: (id: number, amount: number): Promise<Goal> =>
    apiRequest<Goal>(`/api/goals/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    }),
};

// Generic API service for other modules
export const apiService = {
  get: <T>(endpoint: string): Promise<T> => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data?: any): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: any): Promise<T> =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string): Promise<T> => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
