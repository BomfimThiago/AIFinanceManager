import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userPreferencesApi, UserPreferencesUpdate } from '../../services/apiService';

// Query keys
export const userPreferencesKeys = {
  all: ['userPreferences'] as const,
  details: () => [...userPreferencesKeys.all, 'details'] as const,
};

// Queries
export function useUserPreferences(enabled: boolean = true) {
  return useQuery({
    queryKey: userPreferencesKeys.details(),
    queryFn: userPreferencesApi.get,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled, // Only fetch when enabled (authenticated)
  });
}

// Mutations
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: UserPreferencesUpdate) => 
      userPreferencesApi.update(preferences),
    onSuccess: () => {
      // Invalidate and refetch user preferences
      queryClient.invalidateQueries({ queryKey: userPreferencesKeys.all });
    },
  });
}

export function useUpdateCurrencyPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (currency: string) => 
      userPreferencesApi.updateCurrency(currency),
    onSuccess: () => {
      // Invalidate and refetch user preferences
      queryClient.invalidateQueries({ queryKey: userPreferencesKeys.all });
    },
  });
}

export function useUpdateLanguagePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: string) => 
      userPreferencesApi.updateLanguage(language),
    onSuccess: () => {
      // Invalidate and refetch user preferences
      queryClient.invalidateQueries({ queryKey: userPreferencesKeys.all });
    },
  });
}

export function useUpdateUIPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (uiPreferences: Record<string, any>) => 
      userPreferencesApi.updateUI(uiPreferences),
    onSuccess: () => {
      // Invalidate and refetch user preferences
      queryClient.invalidateQueries({ queryKey: userPreferencesKeys.all });
    },
  });
}