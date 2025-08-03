/**
 * Filters Hook - Manages global data filtering state
 * Provides clean interface for filter operations
 */
import { useCallback } from 'react';

import { GlobalFilters, useAppState } from '../store/AppStateManager';

export function useAppFilters() {
  const { state, dispatch } = useAppState();

  const setFilters = useCallback(
    (filters: Partial<GlobalFilters>) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, [dispatch]);

  const setSearchFilter = useCallback(
    (search: string | null) => {
      dispatch({ type: 'SET_FILTERS', payload: { search } });
    },
    [dispatch]
  );

  const setCategoryFilter = useCallback(
    (category: string | null) => {
      dispatch({ type: 'SET_FILTERS', payload: { category } });
    },
    [dispatch]
  );

  const setTypeFilter = useCallback(
    (type: 'income' | 'expense' | null) => {
      dispatch({ type: 'SET_FILTERS', payload: { type } });
    },
    [dispatch]
  );

  const setDateRange = useCallback(
    (startDate: string | null, endDate: string | null) => {
      dispatch({ type: 'SET_FILTERS', payload: { startDate, endDate } });
    },
    [dispatch]
  );

  return {
    filters: state.filters,
    setFilters,
    resetFilters,
    setSearchFilter,
    setCategoryFilter,
    setTypeFilter,
    setDateRange,
    // Helper for TanStack Query
    getQueryFilters: () => ({
      type: state.filters.type,
      category: state.filters.category,
      startDate: state.filters.startDate,
      endDate: state.filters.endDate,
      search: state.filters.search,
    }),
  };
}
