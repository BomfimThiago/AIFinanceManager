// User types
export interface User {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
}

// Receipt types
export interface ReceiptItem {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  id: number;
  storeName: string | null;
  totalAmount: number | null;
  currency: string;
  purchaseDate: string | null;
  category: ExpenseCategory | null;
  status: ReceiptStatus;
  imageUrl: string;
  items: ReceiptItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptUploadResponse {
  receiptId: number;
  status: ReceiptStatus;
  message: string;
}

// Expense types
export interface Expense {
  id: number;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expenseDate: string;
  storeName: string | null;
  notes: string | null;
  receiptId: number | null;
  // Converted amounts using historical exchange rates
  amountUsd: number | null;
  amountEur: number | null;
  amountBrl: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreate {
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  expenseDate: string;
  storeName?: string;
  notes?: string;
  receiptId?: number;
}

// Enums
export type ReceiptStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ExpenseCategory =
  | 'groceries'
  | 'dining'
  | 'transportation'
  | 'utilities'
  | 'entertainment'
  | 'healthcare'
  | 'shopping'
  | 'housing'
  | 'education'
  | 'travel'
  | 'other';

export type Currency = 'USD' | 'EUR' | 'BRL' | 'GBP';

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthToken {
  accessToken: string;
  tokenType: string;
}

// API Response types
export interface ApiError {
  detail: string;
}
