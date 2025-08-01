/**
 * Finance Operations Hook - Central business logic hub
 * Replaces business logic from FinanceManager component
 * Follows hexagonal architecture with service layer separation
 */

import { useState, useMemo } from 'react';

// TanStack Query hooks
import { useExpenses, useCreateBulkExpenses } from './queries';
import { useBudgets, useUpdateBudgetSpent } from './queries';
import { useCategories } from './queries';
import { useGenerateInsights } from './queries';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from './queries';

// Custom hooks
import { useGlobalFilters } from '../contexts/GlobalFiltersContext';
import { useAppNotifications } from './useAppNotifications';
import { useFileUpload } from './useFileUpload';

// Services
import { GoalsService } from '../services/goalsService';
import { ExpensesService } from '../services/expensesService';

// Utils
import { convertAPICategoriesList } from '../utils/categoryMapper';
import { getUserFriendlyError } from '../utils/errorMessages';
import { transformApiBudgetsToBudgets } from '../utils/budgetHelpers';

// Types
import type { AIInsight } from '../types';

export function useFinanceOperations() {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  // App state hooks
  const { filters } = useGlobalFilters();
  const { showError, showSuccess } = useAppNotifications();

  // Handle multiple vs single category filtering
  const hasMultipleCategories = filters.categories && filters.categories.length > 1;
  
  // For multiple categories, don't send category filter to backend (we'll filter client-side)
  // For single category, send it to backend for better performance
  const queryFilters = {
    type: filters.type,
    category: !hasMultipleCategories && filters.categories && filters.categories.length === 1 
      ? filters.categories[0] 
      : undefined,
    startDate: filters.startDate,
    endDate: filters.endDate,
    search: filters.search,
  };
  
  // Debug current filters state
  console.log('🔍 useFinanceOperations filters:', {
    globalFilters: filters,
    queryFilters: queryFilters,
    hasMultipleCategories: hasMultipleCategories,
    willFilterClientSide: hasMultipleCategories
  });
  const {
    data: rawExpenses = [],
    isLoading: expensesLoading,
    error: expensesError,
  } = useExpenses({
    ...queryFilters,
    type: queryFilters.type || undefined,
  });
  
  // Apply client-side category filtering for multiple categories
  const expenses = useMemo(() => {
    if (!hasMultipleCategories || !filters.categories) {
      return rawExpenses;
    }
    
    // Filter expenses to show ANY of the selected categories (OR operation)
    const filtered = rawExpenses.filter(expense => 
      filters.categories!.includes(expense.category)
    );
    
    console.log('📊 Client-side category filtering:', {
      selectedCategories: filters.categories,
      totalExpenses: rawExpenses.length,
      filteredCount: filtered.length,
      filteredExpenses: filtered.map(e => ({ id: e.id, category: e.category, description: e.description }))
    });
    
    return filtered;
  }, [rawExpenses, hasMultipleCategories, filters.categories]);

  const { 
    data: budgetsData, 
    isLoading: budgetsLoading, 
    error: budgetsError 
  } = useBudgets();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories(true);

  const { 
    data: goals = [], 
    isLoading: goalsLoading, 
    error: goalsError 
  } = useGoals();

  // Mutations
  const createBulkExpensesMutation = useCreateBulkExpenses();
  const updateBudgetSpentMutation = useUpdateBudgetSpent();
  const generateInsightsMutation = useGenerateInsights();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  // Service instances
  const goalsService = new GoalsService(
    createGoalMutation,
    updateGoalMutation,
    deleteGoalMutation,
    (type, title, message) => {
      if (type === 'success') showSuccess(message, title);
      else showError(title, message);
    }
  );

  const expensesService = new ExpensesService(
    createBulkExpensesMutation,
    (type, title, message) => {
      if (type === 'success') showSuccess(message, title);
      else showError(title, message);
    }
  );

  // Business logic functions
  const addExpenses = async (expenses: any[]): Promise<void> => {
    const validation = expensesService.validateExpenseData(expenses);
    if (!validation.valid) {
      showError('Invalid Data', validation.errors.join(', '));
      throw new Error(validation.errors.join(', '));
    }

    const processedExpenses = expensesService.processExpenseData(expenses);
    const result = await expensesService.addExpenses(processedExpenses);
    if (!result.success) {
      throw new Error(result.error || 'Failed to add expenses');
    }
  };

  const updateBudgetSpent = async (category: string, amount: number): Promise<void> => {
    try {
      await updateBudgetSpentMutation.mutateAsync({ category, amount });
    } catch (error: any) {
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
      throw new Error(friendlyError.message);
    }
  };

  const generateInsights = async (): Promise<void> => {
    try {
      const result = await generateInsightsMutation.mutateAsync();
      if (result) {
        setAiInsights(result);
        showSuccess('AI insights generated successfully', 'Insights Generated');
      }
    } catch (error: any) {
      console.error('Generate insights error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
  };

  // File upload integration
  const {
    uploadedFiles,
    dragActive,
    isProcessing,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
    triggerFileInput,
  } = useFileUpload({
    onExpenseAdded: addExpenses,
    onBudgetUpdate: updateBudgetSpent,
  });

  // Data processing
  const categories = categoriesData?.categories
    ? convertAPICategoriesList(categoriesData.categories)
    : [];
  
  const budgets = budgetsData ? transformApiBudgetsToBudgets(budgetsData) : {};

  // Loading states
  const isLoading = expensesLoading || budgetsLoading || categoriesLoading || goalsLoading;
  const hasError = expensesError || budgetsError || categoriesError || goalsError;

  return {
    // Data
    expenses,
    budgets,
    categories,
    goals,
    aiInsights,

    // Loading states
    isLoading,
    hasError,

    // Business operations
    addExpenses,
    updateBudgetSpent,
    generateInsights,
    
    // Goals operations
    createGoal: goalsService.createGoal.bind(goalsService),
    updateGoal: goalsService.updateGoal.bind(goalsService),
    deleteGoal: goalsService.deleteGoal.bind(goalsService),

    // File upload
    fileUpload: {
      uploadedFiles,
      dragActive,
      isProcessing,
      fileInputRef,
      handleDrag,
      handleDrop,
      handleFileInput,
      triggerFileInput,
    },

    // Mutation states for UI feedback
    mutations: {
      isCreatingExpenses: createBulkExpensesMutation.isPending,
      isGeneratingInsights: generateInsightsMutation.isPending,
      isCreatingGoal: createGoalMutation.isPending,
      isUpdatingGoal: updateGoalMutation.isPending,
      isDeletingGoal: deleteGoalMutation.isPending,
    },
  };
}