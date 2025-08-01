/**
 * Global State Provider - Replaces multiple context providers
 * Implements centralized state management following React 19 best practices
 */

import React, { useReducer, useEffect, ReactNode } from 'react';
import { AppStateContext, appStateReducer, initialAppState } from './AppStateManager';

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appStateReducer, initialAppState);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      // Load user preferences from localStorage
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      }

      // Load authentication state
      const authToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      if (authToken && userData) {
        dispatch({
          type: 'SET_AUTH',
          payload: {
            isAuthenticated: true,
            user: JSON.parse(userData),
          },
        });
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }, []);

  // Persist preferences changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
    } catch (error) {
      console.error('Failed to persist preferences:', error);
    }
  }, [state.preferences]);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    state.notifications.forEach((notification) => {
      const timeoutId = setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
      }, 5000);
      timeouts.push(timeoutId);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [state.notifications]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}