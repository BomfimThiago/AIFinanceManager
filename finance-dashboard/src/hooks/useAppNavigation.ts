/**
 * Navigation Hook - Handles tab navigation and sidebar state
 * Abstracts UI navigation logic from components
 */
import { useCallback } from 'react';

import { useAppState } from '../store/AppStateManager';
import type { TabId } from '../types';

export function useAppNavigation() {
  const { state, dispatch } = useAppState();

  const setActiveTab = useCallback(
    (tabId: TabId) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    },
    [dispatch]
  );

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, [dispatch]);

  return {
    activeTab: state.activeTab as TabId,
    sidebarVisible: state.sidebarVisible,
    setActiveTab,
    toggleSidebar,
  };
}
