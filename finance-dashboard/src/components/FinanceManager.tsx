import React, { useState, useCallback } from 'react';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import { useExpenses, useCreateBulkExpenses } from '../hooks/queries';
import { useBudgets, useCreateBudget, useUpdateBudgetSpent } from '../hooks/queries';
import { useGenerateInsights } from '../hooks/queries';
import { useFileUpload } from '../hooks/useFileUpload';
import { usePrivacyMode } from '../hooks/usePrivacyMode';
import { useCurrency } from '../contexts/CurrencyContext';
import { categories } from '../constants/categories';
import type { TabId, AIInsight } from '../types';

const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [expenseFilters, setExpenseFilters] = useState<{ month?: number; year?: number; category?: string }>({});
  
  const { convertAmount, selectedCurrency } = useCurrency();

  // TanStack Query hooks
  // Note: Backend filtering only supports month/year, category filtering is done on frontend
  const backendFilters = { month: expenseFilters.month, year: expenseFilters.year };
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useExpenses(backendFilters);
  const { data: budgets = {}, isLoading: budgetsLoading, error: budgetsError } = useBudgets();
  
  // Mutations
  const createBulkExpensesMutation = useCreateBulkExpenses();
  // const uploadFileMutation = useUploadExpenseFile(); // Currently handled by useFileUpload hook
  const createBudgetMutation = useCreateBudget();
  const updateBudgetSpentMutation = useUpdateBudgetSpent();
  const generateInsightsMutation = useGenerateInsights();

  const { hideAmounts, togglePrivacyMode } = usePrivacyMode();

  // Helper function to convert expense amounts to selected currency
  const getConvertedAmount = (expense: any) => {
    // If expense has pre-calculated amounts for the selected currency, use that
    if (expense.amounts && expense.amounts[selectedCurrency]) {
      return expense.amounts[selectedCurrency];
    }
    // Otherwise, convert using current rates
    return convertAmount(expense.amount, expense.original_currency || 'EUR');
  };

  // Calculate net amount in selected currency
  const calculateNetAmountInCurrency = (expenses: any[]) => {
    const totalIncome = expenses
      .filter(expense => expense.type === 'income')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);
    
    const totalExpenses = expenses
      .filter(expense => expense.type === 'expense')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);
    
    return totalIncome - totalExpenses;
  };

  // Wrapper functions for the hooks
  const addExpense = async (expenses: any[]) => {
    await createBulkExpensesMutation.mutateAsync(expenses);
  };

  const addBudget = async (category: string, limit: string | number) => {
    await createBudgetMutation.mutateAsync({ 
      category, 
      limit: parseFloat(limit.toString()) 
    });
  };

  const updateBudgetSpent = async (category: string, amount: number) => {
    await updateBudgetSpentMutation.mutateAsync({ category, amount });
  };

  const {
    uploadedFiles,
    dragActive,
    isProcessing,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
    triggerFileInput
  } = useFileUpload({
    onExpenseAdded: addExpense,
    onBudgetUpdate: updateBudgetSpent
  });

  // Calculate net amount using summary data or fallback to local calculation
  // Calculate net amount in selected currency
  const netAmount = calculateNetAmountInCurrency(expenses);

  const handleGenerateInsights = async (): Promise<void> => {
    try {
      const insights = await generateInsightsMutation.mutateAsync();
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  const handleFiltersChange = useCallback((filters: { month?: number; year?: number }) => {
    setExpenseFilters(filters);
  }, []);

  // Show loading state
  if (expensesLoading || budgetsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (expensesError || budgetsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600">
            <p className="text-lg font-semibold">Error loading data</p>
            <p className="mt-2">{expensesError?.message || budgetsError?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            expenses={expenses}
            budgets={budgets}
            hideAmounts={hideAmounts}
          />
        );
      case 'upload':
        return (
          <Upload
            uploadedFiles={uploadedFiles}
            dragActive={dragActive}
            isProcessing={isProcessing}
            fileInputRef={fileInputRef}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileInput={handleFileInput}
            triggerFileInput={triggerFileInput}
            hideAmounts={hideAmounts}
          />
        );
      case 'expenses':
        return (
          <Expenses
            expenses={expenses}
            categories={categories}
            hideAmounts={hideAmounts}
            onFiltersChange={handleFiltersChange}
          />
        );
      case 'budgets':
        return (
          <Budgets
            budgets={budgets}
            categories={categories}
            onAddBudget={addBudget}
            hideAmounts={hideAmounts}
          />
        );
      case 'insights':
        return (
          <Insights
            aiInsights={aiInsights}
            onGenerateInsights={handleGenerateInsights}
            expenses={expenses}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        netAmount={netAmount}
        hideAmounts={hideAmounts}
        onTogglePrivacy={togglePrivacyMode}
      />
      
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default FinanceManager;