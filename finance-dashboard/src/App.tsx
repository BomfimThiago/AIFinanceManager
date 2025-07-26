import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthPage from './components/auth/AuthPage';
import FinanceManager from './components/FinanceManager';

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
    return (
      <NotificationProvider>
        <AuthPage />
      </NotificationProvider>
    );
  }

  // Show main finance manager if authenticated
  return (
    <NotificationProvider>
      <FinanceManager />
    </NotificationProvider>
  );
};

export default App;