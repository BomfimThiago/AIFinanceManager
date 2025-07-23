import React, { useState } from 'react';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import { useExpenses, useExpenseSummary, useCreateExpense } from '../hooks/queries';
import { useBudgets, useCreateBudget, useUpdateBudgetSpent } from '../hooks/queries';
import { useGenerateInsights } from '../hooks/queries';
import { useFileUpload } from '../hooks/useFileUpload';
import { usePrivacyMode } from '../hooks/usePrivacyMode';
import { categories } from '../constants/categories';
import { calculateNetAmount } from '../utils/apiCalculations';
import type { TabId, AIInsight } from '../types';

const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  // TanStack Query hooks
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useExpenses();
  const { data: budgets = {}, isLoading: budgetsLoading, error: budgetsError } = useBudgets();
  const { data: expenseSummary } = useExpenseSummary();
  
  // Mutations
  const createExpenseMutation = useCreateExpense();
  // const uploadFileMutation = useUploadExpenseFile(); // Currently handled by useFileUpload hook
  const createBudgetMutation = useCreateBudget();
  const updateBudgetSpentMutation = useUpdateBudgetSpent();
  const generateInsightsMutation = useGenerateInsights();

  const { hideAmounts, togglePrivacyMode } = usePrivacyMode();

  // Wrapper functions for the hooks
  const addExpense = async (expense: any) => {
    await createExpenseMutation.mutateAsync(expense);
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
  const netAmount = expenseSummary?.net_amount ?? calculateNetAmount(expenses);

  const handleGenerateInsights = async (): Promise<void> => {
    try {
      const insights = await generateInsightsMutation.mutateAsync();
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

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