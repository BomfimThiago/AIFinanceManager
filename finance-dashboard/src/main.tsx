import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { GlobalFiltersProvider } from './contexts/GlobalFiltersContext'
import { UserPreferencesProvider } from './contexts/UserPreferencesContext'
import App from './App.tsx'
import './index.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime in v4)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <CurrencyProvider>
            <LanguageProvider>
              <UserPreferencesProvider>
                <GlobalFiltersProvider>
                  <App />
                </GlobalFiltersProvider>
              </UserPreferencesProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)