/**
 * Notifications Hook - Unified notification management
 * Replaces multiple toast/notification contexts
 */

import { useCallback } from 'react';
import { useAppState } from '../store/AppStateManager';

export function useAppNotifications() {
  try {
    const { state, dispatch } = useAppState();

  const showSuccess = useCallback((message: string, title?: string) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: title ? `${title}: ${message}` : message,
        type: 'success',
      },
    });
  }, [dispatch]);

  const showError = useCallback((title: string, message: string) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `${title}: ${message}`,
        type: 'error',
      },
    });
  }, [dispatch]);

  const showInfo = useCallback((message: string) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message,
        type: 'info',
      },
    });
  }, [dispatch]);

  const showWarning = useCallback((message: string) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message,
        type: 'warning',
      },
    });
  }, [dispatch]);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, [dispatch]);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, [dispatch]);

    return {
      notifications: state.notifications,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      removeNotification,
      clearNotifications,
    };
  } catch (error) {
    // Fallback to empty functions if AppStateProvider is not available
    console.warn('AppStateProvider not available, using fallback notifications');
    return {
      notifications: [],
      showSuccess: () => {},
      showError: () => {},
      showInfo: () => {},
      showWarning: () => {},
      removeNotification: () => {},
      clearNotifications: () => {},
    };
  }
}