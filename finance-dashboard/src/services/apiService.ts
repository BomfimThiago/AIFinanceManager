import { Expense, AIInsight, Budgets, AuthToken, LoginCredentials, SignupCredentials, User, UploadHistory, CurrencyInfo, ExchangeRates } from '../types';

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
      setAuthToken(null);
      // Don't redirect if we're already on auth endpoints
      if (!endpoint.includes('/api/auth/')) {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized - please login again');
    }

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
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
  getAll: (filters?: { month?: number; year?: number }): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.month && filters.month > 0) {
      params.append('month', filters.month.toString());
    }
    if (filters?.year && filters.year > 0) {
      params.append('year', filters.year.toString());
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

  getCategoriesChart: (): Promise<Array<{name: string; value: number; color: string}>> =>
    apiRequest('/api/expenses/charts/categories'),

  getMonthlyChart: (): Promise<Array<{month: string; income: number; expenses: number}>> =>
    apiRequest('/api/expenses/charts/monthly'),

  getCategorySpending: (params: { currency?: string; month?: number; year?: number } = {}): Promise<{
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
    const endpoint = queryString ? `/api/expenses/category-spending?${queryString}` : '/api/expenses/category-spending';
    
    return apiRequest(endpoint);
  },

  update: (expenseId: number, expense: Omit<Expense, 'id'>): Promise<Expense> =>
    apiRequest<Expense>(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    }),

  delete: (expenseId: number): Promise<{message: string}> =>
    apiRequest(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
};

// Budget API calls
export const budgetApi = {
  getAll: (): Promise<Record<string, {limit: number; spent: number}>> =>
    apiRequest('/api/budgets'),

  create: (budget: {category: string; limit: number}): Promise<{limit: number; spent: number}> =>
    apiRequest('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    }),

  updateSpent: (category: string, amount: number): Promise<{limit: number; spent: number}> =>
    apiRequest(`/api/budgets/${category}/spent`, {
      method: 'PUT',
      body: JSON.stringify(amount),
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  delete: (category: string): Promise<{message: string}> =>
    apiRequest(`/api/budgets/${category}`, {
      method: 'DELETE',
    }),
};

// AI Insights API calls
export const insightsApi = {
  generate: (): Promise<AIInsight[]> =>
    apiRequest('/api/insights', {
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

export const generateAIInsights = async (_expenses: Expense[], _budgets: Budgets): Promise<AIInsight[]> => {
  try {
    return await insightsApi.generate();
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [];
  }
};

// Currency API functions
export const getCurrencies = async (): Promise<CurrencyInfo> => {
  const response = await apiRequest<{currencies: Record<string, {name: string, symbol: string, flag: string, code: string}>}>('/api/currencies');
  return {
    currencies: response.currencies,
    supported: Object.keys(response.currencies)
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
        user: response.token.user
      };
    }
    throw new Error(response.message || 'Login failed');
  },

  signup: async (credentials: SignupCredentials): Promise<AuthToken> => {
    const response = await apiRequest<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        terms_accepted: true
      }),
    });
    
    // Handle new auth response structure
    if (response.success && response.user) {
      // For registration, we need to login separately
      return await authApi.login({
        email: credentials.email,
        password: credentials.password
      });
    }
    throw new Error(response.message || 'Registration failed');
  },

  logout: (): void => {
    setAuthToken(null);
  },

  getCurrentUser: (): Promise<User> =>
    apiRequest<User>('/api/auth/me'),

  refreshToken: (refreshToken: string): Promise<AuthToken> =>
    apiRequest<AuthToken>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),
};

// Upload History API
export const uploadHistoryApi = {
  getAll: (): Promise<UploadHistory[]> =>
    apiRequest<UploadHistory[]>('/api/upload-history/'),

  delete: (uploadId: number): Promise<{ message: string }> =>
    apiRequest<{ message: string }>(`/api/upload-history/${uploadId}`, {
      method: 'DELETE',
    }),
};