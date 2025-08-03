/**
 * Dashboard Data Hook - Business logic for dashboard operations
 * Separates data processing and calculations from UI components
 */
import { useCallback, useMemo, useState } from 'react';

import { useGlobalFilters } from '../contexts/GlobalFiltersContext';
import type { Budgets, Expense } from '../types';
import { useCategoryChartData, useExpenseSummary, useMonthlyChartData } from './queries';
import { useUserPreferences } from './useUserPreferences';

interface DashboardInteractionState {
  selectedCategory: string | null;
  selectedTimeRange: { start: string; end: string } | null;
  selectedDate: string | null;
}

interface DashboardCalculations {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  budgetCount: number;
}

interface DashboardDataResult {
  // Data
  calculations: DashboardCalculations;
  categoryData: any[];
  monthlyData: any[];

  // Loading states
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;

  // Interaction state
  interactionState: DashboardInteractionState;
  hasActiveFilters: boolean;
  hasActiveDashboardState: boolean;

  // Actions
  handleCategoryClick: (category: string) => void;
  handleTimeRangeSelect: (startDate: string, endDate: string) => void;
  handleDateClick: (date: string) => void;
  resetDashboardFilters: () => void;

  // Utility functions
  getConvertedAmount: (expense: Expense) => number;
  getConversionRateDisplay: () => string | null;
}

export function useDashboardData(expenses: Expense[], budgets: Budgets): DashboardDataResult {
  const { currency } = useUserPreferences();
  const { filters, clearFilters } = useGlobalFilters();

  // Dashboard interaction state
  const [interactionState, setInteractionState] = useState<DashboardInteractionState>({
    selectedCategory: null,
    selectedTimeRange: null,
    selectedDate: null,
  });

  // Data fetching hooks
  const { isLoading: summaryLoading, error: summaryError } = useExpenseSummary();
  const {
    data: categoryData = [],
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryChartData();
  const {
    data: monthlyData = [],
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useMonthlyChartData();

  // Chart interaction handlers
  const handleCategoryClick = useCallback((category: string) => {
    setInteractionState(prev => ({
      ...prev,
      selectedCategory: category,
    }));
  }, []);

  const handleTimeRangeSelect = useCallback((startDate: string, endDate: string) => {
    setInteractionState(prev => ({
      ...prev,
      selectedTimeRange: { start: startDate, end: endDate },
    }));
  }, []);

  const handleDateClick = useCallback((date: string) => {
    setInteractionState(prev => ({
      ...prev,
      selectedDate: date,
    }));
  }, []);

  const resetDashboardFilters = useCallback(() => {
    setInteractionState({
      selectedCategory: null,
      selectedTimeRange: null,
      selectedDate: null,
    });
    clearFilters();
  }, [clearFilters]);

  // Currency conversion utilities
  const getConvertedAmount = useCallback(
    (expense: Expense) => {
      // TODO: Implement currency conversion logic
      // For now, return the amount as-is
      return expense.amount;
    },
    [currency]
  );

  const getConversionRateDisplay = useCallback(() => {
    // TODO: Implement conversion rate display logic
    if (currency === 'EUR') return null;
    return null; // Placeholder
  }, [currency]);

  // Financial calculations
  const calculations = useMemo<DashboardCalculations>(() => {
    const totalIncome = expenses
      .filter(expense => expense.type === 'income')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    const totalExpenses = expenses
      .filter(expense => expense.type === 'expense')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    const netAmount = totalIncome - totalExpenses;
    const budgetCount = Object.keys(budgets).length;

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      budgetCount,
    };
  }, [expenses, budgets, getConvertedAmount]);

  // Loading and error states
  const isLoading = summaryLoading || categoryLoading || monthlyLoading;
  const hasError = !!(summaryError || categoryError || monthlyError);
  const errorMessage = hasError ? 'Failed to load dashboard data' : null;

  // Active filters detection
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      value => value !== undefined && value !== null && value !== ''
    );
  }, [filters]);

  const hasActiveDashboardState = !!(
    interactionState.selectedCategory ||
    interactionState.selectedTimeRange ||
    interactionState.selectedDate
  );

  return {
    // Data
    calculations,
    categoryData,
    monthlyData,

    // Loading states
    isLoading,
    hasError,
    errorMessage,

    // Interaction state
    interactionState,
    hasActiveFilters,
    hasActiveDashboardState,

    // Actions
    handleCategoryClick,
    handleTimeRangeSelect,
    handleDateClick,
    resetDashboardFilters,

    // Utility functions
    getConvertedAmount,
    getConversionRateDisplay,
  };
}
