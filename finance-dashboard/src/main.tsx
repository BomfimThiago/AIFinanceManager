/**
 * Refactored Main Entry Point - Consolidated state management
 * Replaces multiple context providers with unified AppStateProvider
 */
import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ReactDOM from 'react-dom/client';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { GlobalFiltersProvider } from './contexts/GlobalFiltersContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import './index.css';
import { AppStateProvider } from './store/AppStateProvider';

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
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ToastProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <CategoriesProvider>
              <UserPreferencesProvider>
                <GlobalFiltersProvider>
                  <AppStateProvider>
                    <App />
                  </AppStateProvider>
                </GlobalFiltersProvider>
              </UserPreferencesProvider>
            </CategoriesProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ToastProvider>
    </AuthProvider>
  </QueryClientProvider>
);
