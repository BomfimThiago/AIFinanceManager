import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../services/api';
import { Category, CategoryCreate, CategoryType, CategoryUpdate } from '../types';

interface CategoryFilters {
  type?: CategoryType;
  includeHidden?: boolean;
}

interface UseCategoriesOptions {
  filters?: CategoryFilters;
  enabled?: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { filters, enabled = true } = options;
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: () => categoriesApi.getAll(filters),
    enabled,
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: CategoryCreate) => categoriesApi.create(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
      categoriesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories', variables.id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useToggleCategoryVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hide }: { id: number; hide: boolean }) =>
      hide ? categoriesApi.hide(id) : categoriesApi.unhide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useInitializeCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoriesApi.initialize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Helper hook to get categories grouped by type
export function useCategoriesByType(options: UseCategoriesOptions = {}) {
  const { data: categories, ...rest } = useCategories(options);

  const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];
  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];

  return {
    ...rest,
    categories,
    expenseCategories,
    incomeCategories,
  };
}
