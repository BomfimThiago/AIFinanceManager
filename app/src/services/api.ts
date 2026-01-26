import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import { API_URL } from '../constants/config';
import { getAuthToken, handleUnauthorized } from './tokenProvider';
import {
  AuthToken,
  Category,
  CategoryCreate,
  CategoryType,
  CategoryUpdate,
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  LoginCredentials,
  PaginatedResponse,
  Receipt,
  ReceiptUploadResponse,
  RegisterData,
  User,
} from '../types';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to extract error message from backend response
function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data as { detail?: string | { msg: string }[] } | undefined;

  if (data?.detail) {
    // FastAPI returns { detail: "message" } or { detail: [{ msg: "..." }] }
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail.map((d) => d.msg).join(', ');
    }
  }

  // Fallback error messages
  switch (error.response?.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Invalid credentials. Please try again.';
    case 403:
      return 'Access denied.';
    case 404:
      return 'Resource not found.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only logout if we have a token (authenticated request failed)
      const token = getAuthToken();
      if (token) {
        handleUnauthorized();
      }
    }

    // Create a new error with a user-friendly message
    const message = extractErrorMessage(error);
    const enhancedError = new Error(message);
    return Promise.reject(enhancedError);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const { data } = await api.post<AuthToken>('/auth/login', credentials);
    return data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const { data } = await api.post<User>('/auth/register', userData);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};

// Helper to get file extension and info
function getFileInfo(uri: string, mimeType?: string): { type: string; name: string; extension: string } {
  const extension = uri.split('.').pop()?.toLowerCase() || '';

  // Use provided mimeType or detect from extension
  let type = mimeType;
  if (!type) {
    switch (extension) {
      case 'pdf':
        type = 'application/pdf';
        break;
      case 'png':
        type = 'image/png';
        break;
      case 'webp':
        type = 'image/webp';
        break;
      case 'heic':
        type = 'image/heic';
        break;
      case 'jpg':
      case 'jpeg':
      default:
        type = 'image/jpeg';
        break;
    }
  }

  const ext = type === 'application/pdf' ? 'pdf' :
              type === 'image/png' ? 'png' :
              type === 'image/webp' ? 'webp' : 'jpg';

  return { type, name: `receipt.${ext}`, extension: ext };
}

// Receipts API
export const receiptsApi = {
  upload: async (fileUri: string, mimeType?: string): Promise<ReceiptUploadResponse> => {
    const formData = new FormData();
    const fileInfo = getFileInfo(fileUri, mimeType);

    // On web, we need to fetch the file as a blob
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        formData.append('file', blob, fileInfo.name);
      } catch (error) {
        console.error('Error fetching file blob:', error);
        throw new Error('Failed to read file');
      }
    } else {
      // On native, use the uri/type/name format
      formData.append('file', {
        uri: fileUri,
        type: fileInfo.type,
        name: fileInfo.name,
      } as unknown as Blob);
    }

    const { data } = await api.post<ReceiptUploadResponse>('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 seconds for file upload (processing happens in background)
    });
    return data;
  },

  getAll: async (page = 1, limit = 50): Promise<PaginatedResponse<Receipt>> => {
    const { data } = await api.get<PaginatedResponse<Receipt>>('/receipts', {
      params: { page, limit },
    });
    return data;
  },

  getById: async (id: number): Promise<Receipt> => {
    const { data } = await api.get<Receipt>(`/receipts/${id}`);
    return data;
  },

  update: async (id: number, updateData: Partial<Receipt>): Promise<Receipt> => {
    const { data } = await api.patch<Receipt>(`/receipts/${id}`, updateData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/receipts/${id}`);
  },
};

// Expenses API
export const expensesApi = {
  create: async (expense: ExpenseCreate): Promise<Expense> => {
    const { data } = await api.post<Expense>('/expenses', expense);
    return data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<PaginatedResponse<Expense>> => {
    const queryParams = { page: 1, limit: 100, ...params };
    const { data } = await api.get<PaginatedResponse<Expense>>('/expenses', { params: queryParams });
    return data;
  },

  getById: async (id: number): Promise<Expense> => {
    const { data } = await api.get<Expense>(`/expenses/${id}`);
    return data;
  },

  update: async (id: number, updateData: ExpenseUpdate): Promise<Expense> => {
    const { data } = await api.patch<Expense>(`/expenses/${id}`, updateData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (params?: {
    type?: CategoryType;
    includeHidden?: boolean;
  }): Promise<Category[]> => {
    const { data } = await api.get<Category[]>('/categories', { params });
    return data;
  },

  getById: async (id: number): Promise<Category> => {
    const { data } = await api.get<Category>(`/categories/${id}`);
    return data;
  },

  create: async (category: CategoryCreate): Promise<Category> => {
    const { data } = await api.post<Category>('/categories', category);
    return data;
  },

  update: async (id: number, updateData: CategoryUpdate): Promise<Category> => {
    const { data } = await api.patch<Category>(`/categories/${id}`, updateData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  hide: async (id: number): Promise<Category> => {
    const { data } = await api.post<Category>(`/categories/${id}/hide`);
    return data;
  },

  unhide: async (id: number): Promise<Category> => {
    const { data } = await api.post<Category>(`/categories/${id}/unhide`);
    return data;
  },

  initialize: async (): Promise<Category[]> => {
    const { data } = await api.post<Category[]>('/categories/initialize');
    return data;
  },
};

export default api;
