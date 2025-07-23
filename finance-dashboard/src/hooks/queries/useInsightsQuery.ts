import { useMutation } from '@tanstack/react-query';
import { insightsApi } from '../../services/apiService';

// Query keys
export const insightKeys = {
  all: ['insights'] as const,
  generate: () => [...insightKeys.all, 'generate'] as const,
};

// Mutations (AI insights are generated on-demand, not cached)
export function useGenerateInsights() {
  return useMutation({
    mutationFn: () => insightsApi.generate(),
    // Don't cache insights as they should be fresh each time
  });
}