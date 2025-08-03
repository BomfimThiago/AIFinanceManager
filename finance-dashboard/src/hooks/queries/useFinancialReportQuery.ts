/**
 * Financial Report Query Hook
 * Handles fetching comprehensive financial report data
 */
import { useQuery } from '@tanstack/react-query';

import { insightsApi } from '../../services/apiService';

// Query keys
export const financialReportKeys = {
  all: ['financial-report'] as const,
  report: (startDate?: string, endDate?: string) =>
    [...financialReportKeys.all, 'current', startDate, endDate] as const,
};

// Financial Report Query
export function useFinancialReport(startDate?: string, endDate?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: financialReportKeys.report(startDate, endDate),
    queryFn: () => insightsApi.getFinancialReport(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    enabled, // Allow disabling the query until date filters are applied
  });
}
