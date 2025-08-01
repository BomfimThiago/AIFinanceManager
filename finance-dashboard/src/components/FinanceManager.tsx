/**
 * Refactored Finance Manager - Clean component following React 19 best practices
 * Separates UI rendering from business logic using hexagonal architecture
 */

import React from 'react';

// Business logic hooks (ports to domain layer)
import { useAppNavigation } from '../hooks/useAppNavigation';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useFinanceOperations } from '../hooks/useFinanceOperations';

// UI Components
import GlobalFiltersSidebar from './layout/GlobalFiltersSidebar';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Upload from './pages/Upload';
import Goals from './pages/Goals';
import Insights from './pages/Insights';
import Integrations from './pages/Integrations';
import CategoryManagement from './pages/CategoryManagement';

// Types

const FinanceManager: React.FC = () => {
  // UI state management (no business logic)
  const { activeTab, sidebarVisible, setActiveTab, toggleSidebar } = useAppNavigation();
  const { hideAmounts, togglePrivacyMode } = useUserPreferences();

  // Business operations (separated from UI)
  const {
    expenses,
    budgets,
    categories,
    goals,
    aiInsights,
    isLoading,
    hasError,
    generateInsights,
    createGoal,
    updateGoal,
    deleteGoal,
    fileUpload,
    mutations,
  } = useFinanceOperations();

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to load financial data
          </h2>
          <p className="text-gray-600">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  // Render tab content (pure UI logic)
  const renderTabContent = (): React.JSX.Element => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            expenses={expenses}
            budgets={budgets}
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

      case 'upload':
        return (
          <Upload
            uploadedFiles={fileUpload.uploadedFiles}
            dragActive={fileUpload.dragActive}
            isProcessing={mutations.isCreatingExpenses}
            fileInputRef={fileUpload.fileInputRef}
            handleDrag={fileUpload.handleDrag}
            handleDrop={fileUpload.handleDrop}
            handleFileInput={fileUpload.handleFileInput}
            triggerFileInput={fileUpload.triggerFileInput}
            hideAmounts={hideAmounts}
          />
        );

      case 'goals':
        return (
          <Goals
            goals={goals}
            categories={categories}
            onCreateGoal={createGoal}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
            hideAmounts={hideAmounts}
          />
        );

      case 'insights':
        return (
          <Insights
            aiInsights={aiInsights}
            onGenerateInsights={generateInsights}
            expenses={expenses}
            isGeneratingInsights={mutations.isGeneratingInsights}
          />
        );

      case 'integrations':
        return <Integrations />;

      case 'categories':
        return <CategoryManagement />;

      default:
        return (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Page not found
            </h2>
          </div>
        );
    }
  };

  // Clean JSX - only UI rendering logic
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onTogglePrivacy={togglePrivacyMode} hideAmounts={hideAmounts} />
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      <div className="flex h-[calc(100vh-120px)]">
        <GlobalFiltersSidebar
          isVisible={sidebarVisible}
          onToggle={toggleSidebar}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinanceManager;