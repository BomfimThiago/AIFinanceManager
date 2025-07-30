import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../../services/apiService';
import { Expense } from '../../types';
import { uploadHistoryKeys } from './useUploadHistoryQuery';

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: any) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: number) => [...expenseKeys.details(), id] as const,
  summary: () => [...expenseKeys.all, 'summary'] as const,
  charts: () => [...expenseKeys.all, 'charts'] as const,
  chartCategories: () => [...expenseKeys.charts(), 'categories'] as const,
  chartMonthly: () => [...expenseKeys.charts(), 'monthly'] as const,
  categorySpending: (params: { currency?: string; month?: number; year?: number }) => 
    [...expenseKeys.all, 'category-spending', params] as const,
};

// Queries
export function useExpenses(filters?: { 
  month?: number; 
  year?: number; 
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}) {
  const normalizedFilters = {
    month: filters?.month && filters.month > 0 ? filters.month : undefined,
    year: filters?.year && filters.year > 0 ? filters.year : undefined,
    type: filters?.type || undefined,
    category: filters?.category || undefined,
    start_date: filters?.startDate || undefined,
    end_date: filters?.endDate || undefined,
    search: filters?.search || undefined,
  };

  return useQuery({
    queryKey: expenseKeys.list(normalizedFilters),
    queryFn: () => expenseApi.getAll(normalizedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    placeholderData: (prev) => prev,
  });
}

export function useExpenseSummary() {
  return useQuery({
    queryKey: expenseKeys.summary(),
    queryFn: () => expenseApi.getSummary(),
  });
}

export function useCategoryChartData() {
  return useQuery({
    queryKey: expenseKeys.chartCategories(),
    queryFn: () => expenseApi.getCategoriesChart(),
  });
}

export function useMonthlyChartData() {
  return useQuery({
    queryKey: expenseKeys.chartMonthly(),
    queryFn: () => expenseApi.getMonthlyChart(),
  });
}

export function useCategorySpending(params: { currency?: string; month?: number; year?: number } = {}) {
  return useQuery({
    queryKey: expenseKeys.categorySpending(params),
    queryFn: () => expenseApi.getCategorySpending(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutations
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: Omit<Expense, 'id'>) => expenseApi.create(expense),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useCreateBulkExpenses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenses: Omit<Expense, 'id'>[]) => expenseApi.createBulk(expenses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useUploadExpenseFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => expenseApi.uploadFile(file),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      // Also invalidate upload history to show the new upload
      queryClient.invalidateQueries({ queryKey: uploadHistoryKeys.lists() });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, expense }: { expenseId: number; expense: Omit<Expense, 'id'> }) => 
      expenseApi.update(expenseId, expense),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: number) => expenseApi.delete(expenseId),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}