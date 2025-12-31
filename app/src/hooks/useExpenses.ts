import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../services/api';
import { Expense, ExpenseCreate, ExpenseUpdate } from '../types';

interface ExpenseFilters {
  skip?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
}

interface UseExpensesOptions {
  filters?: ExpenseFilters;
  enabled?: boolean;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const { filters, enabled = true } = options;
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesApi.getAll(filters),
    enabled,
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expense: ExpenseCreate) => expensesApi.create(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseUpdate }) =>
      expensesApi.update(id, data),
    onSuccess: async () => {
      // Invalidate and immediately refetch all expenses queries
      await queryClient.refetchQueries({
        queryKey: ['expenses'],
        type: 'active',
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
