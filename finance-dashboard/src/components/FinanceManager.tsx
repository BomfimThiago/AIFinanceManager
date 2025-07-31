import React, { useState } from 'react';

import { useGlobalFilters } from '../contexts/GlobalFiltersContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useCreateBulkExpenses, useExpenses } from '../hooks/queries';
import { useBudgets, useCreateBudget, useUpdateBudgetSpent } from '../hooks/queries';
import { useCategories } from '../hooks/queries';
import { useGenerateInsights } from '../hooks/queries';
import { useFileUpload } from '../hooks/useFileUpload';
import { usePrivacyMode } from '../hooks/usePrivacyMode';
import type { AIInsight, TabId } from '../types';
import { convertAPICategoriesList } from '../utils/categoryMapper';
import { getUserFriendlyError } from '../utils/errorMessages';
import GlobalFiltersSidebar from './layout/GlobalFiltersSidebar';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import Budgets from './pages/Budgets';
import CategoryManagement from './pages/CategoryManagement';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Insights from './pages/Insights';
import Integrations from './pages/Integrations';
import Upload from './pages/Upload';

const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const { showError, showSuccess } = useNotificationContext();
  const { filters: globalFilters } = useGlobalFilters();

  // TanStack Query hooks - use global filters
  const expenseQueryFilters = {
    type: globalFilters.type,
    category: globalFilters.category,
    startDate: globalFilters.startDate,
    endDate: globalFilters.endDate,
    search: globalFilters.search,
  };
  const {
    data: expenses = [],
    isLoading: expensesLoading,
    error: expensesError,
  } = useExpenses(expenseQueryFilters);
  const { data: budgets = {}, isLoading: budgetsLoading, error: budgetsError } = useBudgets();
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories(true);

  // Convert API categories to frontend categories
  const categories = categoriesData?.categories
    ? convertAPICategoriesList(categoriesData.categories)
    : [];

  // Mutations
  const createBulkExpensesMutation = useCreateBulkExpenses();
  // const uploadFileMutation = useUploadExpenseFile(); // Currently handled by useFileUpload hook
  const createBudgetMutation = useCreateBudget();
  const updateBudgetSpentMutation = useUpdateBudgetSpent();
  const generateInsightsMutation = useGenerateInsights();

  const { hideAmounts, togglePrivacyMode } = usePrivacyMode();

  // Wrapper functions for the hooks
  const addExpense = async (expenses: any[]) => {
    await createBulkExpensesMutation.mutateAsync(expenses);
  };

  const addBudget = async (category: string, limit: string | number) => {
    try {
      await createBudgetMutation.mutateAsync({
        category,
        limit: parseFloat(limit.toString()),
      });
      showSuccess('Budget Created', 'Budget created successfully');
    } catch (error: any) {
      console.error('Create budget error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
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
    triggerFileInput,
  } = useFileUpload({
    onExpenseAdded: addExpense,
    onBudgetUpdate: updateBudgetSpent,
  });

  const handleGenerateInsights = async (): Promise<void> => {
    try {
      const insights = await generateInsightsMutation.mutateAsync();
      setAiInsights(insights);
      showSuccess('Insights Generated', 'AI insights generated successfully');
    } catch (error: any) {
      console.error('Generate insights error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    }
  };

  // Show loading state
  if (expensesLoading || budgetsLoading || categoriesLoading) {
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
  if (expensesError || budgetsError || categoriesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600">
            <p className="text-lg font-semibold">Error loading data</p>
            <p className="mt-2">
              {expensesError?.message || budgetsError?.message || categoriesError?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard expenses={expenses} budgets={budgets} hideAmounts={hideAmounts} />;
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
        return <Expenses expenses={expenses} categories={categories} hideAmounts={hideAmounts} />;
      case 'budgets':
        return (
          <Budgets
            budgets={budgets}
            categories={categories}
            onAddBudget={addBudget}
            hideAmounts={hideAmounts}
          />
        );
      case 'categories':
        return <CategoryManagement />;
      case 'insights':
        return (
          <Insights
            aiInsights={aiInsights}
            onGenerateInsights={handleGenerateInsights}
            expenses={expenses}
            isGeneratingInsights={generateInsightsMutation.isPending}
          />
        );
      case 'integrations':
        return <Integrations />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideAmounts={hideAmounts} onTogglePrivacy={togglePrivacyMode} />

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex h-[calc(100vh-120px)]">
        <GlobalFiltersSidebar
          isVisible={sidebarVisible}
          onToggle={() => setSidebarVisible(!sidebarVisible)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default FinanceManager;
