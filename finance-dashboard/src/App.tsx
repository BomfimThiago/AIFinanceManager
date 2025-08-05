/**
 * Refactored App Component - Simplified with global state management
 * Uses the new AppStateProvider instead of multiple contexts
 */
import React from 'react';

import FinanceManager from './components/FinanceManager';
import AuthPage from './components/auth/AuthPage';
import NotificationContainer from './components/ui/NotificationContainer';
import TranslationLoadingWrapper from './components/ui/TranslationLoadingWrapper';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show main finance manager if authenticated
  return (
    <TranslationLoadingWrapper>
      <FinanceManager />
      <NotificationContainer />
    </TranslationLoadingWrapper>
  );
};

export default App;
