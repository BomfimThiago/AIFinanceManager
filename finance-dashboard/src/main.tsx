/**
 * Refactored Main Entry Point - Consolidated state management
 * Replaces multiple context providers with unified AppStateProvider
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { AppStateProvider } from './store/AppStateProvider';
import { AuthProvider } from './contexts/AuthContext'; // Keep AuthProvider separate for now
import { GlobalFiltersProvider } from './contexts/GlobalFiltersContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import './index.css';

// Create TanStack Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppStateProvider>
          <ToastProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <UserPreferencesProvider>
                  <CategoriesProvider>
                    <GlobalFiltersProvider>
                      <App />
                    </GlobalFiltersProvider>
                  </CategoriesProvider>
                </UserPreferencesProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </ToastProvider>
        </AppStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);