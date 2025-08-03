/**
 * User Preferences Hook - Manages user settings and preferences
 * Provides clean interface for preference management
 */
import { useCallback } from 'react';

import { UserPreferences, useAppState } from '../store/AppStateManager';

export function useUserPreferences() {
  const { state, dispatch } = useAppState();

  const setPreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    },
    [dispatch]
  );

  const setCurrency = useCallback(
    (currency: string) => {
      dispatch({ type: 'SET_PREFERENCES', payload: { currency } });
    },
    [dispatch]
  );

  const setLanguage = useCallback(
    (language: string) => {
      dispatch({ type: 'SET_PREFERENCES', payload: { language } });
    },
    [dispatch]
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      dispatch({ type: 'SET_PREFERENCES', payload: { theme } });
    },
    [dispatch]
  );

  const togglePrivacyMode = useCallback(() => {
    dispatch({
      type: 'SET_PREFERENCES',
      payload: { hideAmounts: !state.preferences.hideAmounts },
    });
  }, [dispatch, state.preferences.hideAmounts]);

  return {
    preferences: state.preferences,
    currency: state.preferences.currency,
    language: state.preferences.language,
    theme: state.preferences.theme,
    hideAmounts: state.preferences.hideAmounts,
    setPreferences,
    setCurrency,
    setLanguage,
    setTheme,
    togglePrivacyMode,
  };
}
