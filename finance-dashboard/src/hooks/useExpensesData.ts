/**
 * Expenses Data Hook - Business logic for expenses management
 * Handles CRUD operations and data calculations
 */
import { useCallback, useMemo, useState } from 'react';

import type { Category, Expense } from '../types';
import { getExpenseAmountInCurrency } from '../utils/currencyHelpers';
import { getUserFriendlyError } from '../utils/errorMessages';
import { useCreateExpense, useDeleteExpense, useUpdateExpense } from './queries';
import { useAppNotifications } from './useAppNotifications';
import { useUserPreferences } from './useUserPreferences';

interface ExpenseModalState {
  editingExpense: Expense | null;
  isEditModalOpen: boolean;
  expenseToDelete: Expense | null;
  isConfirmModalOpen: boolean;
}

interface ExpenseCalculations {
  totalAmount: number;
  totalIncome: number;
  totalExpenses: number;
  expenseCount: number;
}

interface ExpensesDataResult {
  // Modal state
  modalState: ExpenseModalState;

  // Calculations
  calculations: ExpenseCalculations;

  // Actions
  handleAddClick: () => void;
  handleEditClick: (expense: Expense) => void;
  handleDeleteClick: (expense: Expense) => void;
  handleCloseModals: () => void;
  handleSaveExpense: (expenseData: any) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;

  // Utilities
  getConvertedAmount: (expense: Expense) => number;
  formatExpenseAmount: (expense: Expense) => string;

  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useExpensesData(expenses: Expense[], categories: Category[]): ExpensesDataResult {
  void categories; // Categories used in parent component
  const { currency, hideAmounts } = useUserPreferences();
  const { showSuccess, showError } = useAppNotifications();

  // Modal state
  const [modalState, setModalState] = useState<ExpenseModalState>({
    editingExpense: null,
    isEditModalOpen: false,
    expenseToDelete: null,
    isConfirmModalOpen: false,
  });

  // Mutations
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  // Modal handlers
  const handleAddClick = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      editingExpense: null,
      isEditModalOpen: true,
    }));
  }, []);

  const handleEditClick = useCallback((expense: Expense) => {
    setModalState(prev => ({
      ...prev,
      editingExpense: expense,
      isEditModalOpen: true,
    }));
  }, []);

  const handleDeleteClick = useCallback((expense: Expense) => {
    setModalState(prev => ({
      ...prev,
      expenseToDelete: expense,
      isConfirmModalOpen: true,
    }));
  }, []);

  const handleCloseModals = useCallback(() => {
    setModalState({
      editingExpense: null,
      isEditModalOpen: false,
      expenseToDelete: null,
      isConfirmModalOpen: false,
    });
  }, []);

  // CRUD operations
  const handleSaveExpense = useCallback(
    async (expenseData: any) => {
      try {
        if (modalState.editingExpense) {
          // Update existing expense
          await updateExpenseMutation.mutateAsync({
            expenseId: modalState.editingExpense.id,
            expense: expenseData,
          });
          showSuccess('Expense updated successfully');
        } else {
          // Create new expense
          await createExpenseMutation.mutateAsync(expenseData);
          showSuccess('Expense created successfully');
        }
        handleCloseModals();
      } catch (error: any) {
        console.error('Save expense error:', error);
        const friendlyError = getUserFriendlyError(error);
        showError(friendlyError.title, friendlyError.message);
      }
    },
    [
      modalState.editingExpense,
      updateExpenseMutation,
      createExpenseMutation,
      showSuccess,
      showError,
      handleCloseModals,
    ]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!modalState.expenseToDelete) return;

    try {
      await deleteExpenseMutation.mutateAsync(modalState.expenseToDelete.id);
      showSuccess('Expense deleted successfully');
      handleCloseModals();
    } catch (error: any) {
      console.error('Delete expense error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
  }, [
    modalState.expenseToDelete,
    deleteExpenseMutation,
    showSuccess,
    showError,
    handleCloseModals,
  ]);

  // Currency utilities
  const getConvertedAmount = useCallback(
    (expense: Expense) => {
      // TODO: Implement proper currency conversion
      return getExpenseAmountInCurrency(expense, currency, amount => amount);
    },
    [currency]
  );

  const formatExpenseAmount = useCallback(
    (expense: Expense) => {
      if (hideAmounts) return '••••';

      const amount = getConvertedAmount(expense);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    },
    [getConvertedAmount, hideAmounts, currency]
  );

  // Calculations
  const calculations = useMemo<ExpenseCalculations>(() => {
    const totalIncome = expenses
      .filter(expense => expense.type === 'income')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    const totalExpenses = expenses
      .filter(expense => expense.type === 'expense')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    const totalAmount = expenses.reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    return {
      totalAmount,
      totalIncome,
      totalExpenses,
      expenseCount: expenses.length,
    };
  }, [expenses, getConvertedAmount]);

  return {
    // Modal state
    modalState,

    // Calculations
    calculations,

    // Actions
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    handleCloseModals,
    handleSaveExpense,
    handleConfirmDelete,

    // Utilities
    getConvertedAmount,
    formatExpenseAmount,

    // Loading states
    isCreating: createExpenseMutation.isPending,
    isUpdating: updateExpenseMutation.isPending,
    isDeleting: deleteExpenseMutation.isPending,
  };
}
