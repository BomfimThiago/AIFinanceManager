import { Expense, AIInsight, Budgets } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Generic API request function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Expense API calls
export const expenseApi = {
  getAll: (): Promise<Expense[]> => 
    apiRequest<Expense[]>('/api/expenses'),

  create: (expense: Omit<Expense, 'id'>): Promise<Expense> =>
    apiRequest<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  uploadFile: async (file: File): Promise<Expense> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<Expense>('/api/expenses/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it with boundary for FormData
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
export const processFileWithAI = async (file: File): Promise<Expense | null> => {
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