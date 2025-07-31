import React, { ReactNode, createContext, useCallback, useContext, useState } from 'react';

export interface GlobalFilters {
  category?: string;
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface GlobalFiltersContextType {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  updateFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  clearFilters: () => void;
  clearFilter: (key: keyof GlobalFilters) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(undefined);

export const useGlobalFilters = () => {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within a GlobalFiltersProvider');
  }
  return context;
};

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export const GlobalFiltersProvider: React.FC<GlobalFiltersProviderProps> = ({ children }) => {
  const [filters, setFiltersState] = useState<GlobalFilters>({});

  const setFilters = useCallback((newFilters: GlobalFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => {
      setFiltersState(prev => {
        if (value === undefined || value === '' || value === null) {
          const { [key]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: value };
      });
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const clearFilter = useCallback((key: keyof GlobalFilters) => {
    setFiltersState(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFilterCount = Object.keys(filters).filter(
    key =>
      filters[key as keyof GlobalFilters] !== undefined &&
      filters[key as keyof GlobalFilters] !== ''
  ).length;

  const value: GlobalFiltersContextType = {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
  };

  return <GlobalFiltersContext.Provider value={value}>{children}</GlobalFiltersContext.Provider>;
};
