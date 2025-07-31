import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CategoryCreate, CategoryUpdate, categoryApi } from '../../services/apiService';

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: string) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoryKeys.details(), id] as const,
  stats: () => [...categoryKeys.all, 'stats'] as const,
};

// Get all categories
export const useCategories = (includeDefault: boolean = true) => {
  return useQuery({
    queryKey: categoryKeys.list(includeDefault.toString()),
    queryFn: () => categoryApi.getAll(includeDefault),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get category statistics
export const useCategoryStats = () => {
  return useQuery({
    queryKey: categoryKeys.stats(),
    queryFn: () => categoryApi.getStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create category mutation
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: CategoryCreate) => categoryApi.create(categoryData),
    onSuccess: () => {
      // Invalidate all category queries to refetch data
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

// Update category mutation
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
      categoryApi.update(id, data),
    onSuccess: () => {
      // Invalidate all category queries to refetch data
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

// Delete category mutation
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: () => {
      // Invalidate all category queries to refetch data
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};

// Add category preference mutation
export const useAddCategoryPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountName, categoryName }: { accountName: string; categoryName: string }) =>
      categoryApi.addPreference(accountName, categoryName),
    onSuccess: () => {
      // Invalidate category queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};
