import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { budgetApi } from '../../services/apiService';

// Query keys
export const budgetKeys = {
  all: ['budgets'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...budgetKeys.lists(), { filters }] as const,
  details: () => [...budgetKeys.all, 'detail'] as const,
  detail: (category: string) => [...budgetKeys.details(), category] as const,
};

// Queries
export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: () => budgetApi.getAll(),
  });
}

// Mutations
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budget: { category: string; limit: number }) => budgetApi.create(budget),
    onSuccess: () => {
      // Invalidate and refetch budgets
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useUpdateBudgetSpent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, amount }: { category: string; amount: number }) =>
      budgetApi.updateSpent(category, amount),
    onSuccess: () => {
      // Invalidate and refetch budgets
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: string) => budgetApi.delete(category),
    onSuccess: () => {
      // Invalidate and refetch budgets
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
