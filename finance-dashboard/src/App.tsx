import React, { useState } from 'react';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/pages/Dashboard';
import Upload from './components/pages/Upload';
import Expenses from './components/pages/Expenses';
import Budgets from './components/pages/Budgets';
import Insights from './components/pages/Insights';
import { useExpenses } from './hooks/useExpenses';
import { useBudgets } from './hooks/useBudgets';
import { useFileUpload } from './hooks/useFileUpload';
import { usePrivacyMode } from './hooks/usePrivacyMode';
import { generateAIInsights } from './services/apiService';
import { categories } from './constants/categories';
import { calculateNetAmount } from './utils/apiCalculations';
import type { TabId, AIInsight } from './types';

const FinanceManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);

  const { expenses, addExpense } = useExpenses();
  const { budgets, addBudget, updateBudgetSpent } = useBudgets();
  const { hideAmounts, togglePrivacyMode } = usePrivacyMode();

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

  const netAmount = calculateNetAmount(expenses);

  const handleGenerateInsights = async (): Promise<void> => {
    const insights = await generateAIInsights(expenses, budgets);
    setAiInsights(insights);
  };

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