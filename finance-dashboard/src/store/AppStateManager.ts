/**
 * Global State Manager - Consolidates multiple contexts into unified state management
 * Following hexagonal architecture principles with separation of concerns
 */
import { createContext, useContext } from 'react';

// Domain Types
export interface GlobalFilters {
  type: 'income' | 'expense' | null;
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  search: string | null;
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: string;
  timestamp: number;
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark';
  hideAmounts: boolean;
}

export interface AppState {
  // Global UI State
  activeTab: string;
  sidebarVisible: boolean;

  // Data Filters
  filters: GlobalFilters;

  // User Settings
  preferences: UserPreferences;

  // Notifications
  notifications: NotificationState[];

  // Authentication
  isAuthenticated: boolean;
  user: any | null;
}

// Actions
export type AppAction =
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_FILTERS'; payload: Partial<GlobalFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<NotificationState, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_AUTH'; payload: { isAuthenticated: boolean; user: any | null } };

// Initial State
export const initialAppState: AppState = {
  activeTab: 'overview',
  sidebarVisible: true,
  filters: {
    type: null,
    category: null,
    startDate: null,
    endDate: null,
    search: null,
  },
  preferences: {
    currency: 'USD',
    language: 'en',
    theme: 'light',
    hideAmounts: false,
  },
  notifications: [],
  isAuthenticated: false,
  user: null,
};

// State Reducer
export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarVisible: !state.sidebarVisible };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialAppState.filters,
      };

    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'ADD_NOTIFICATION':
      const newNotification: NotificationState = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    case 'SET_AUTH':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
      };

    default:
      return state;
  }
}

// Context Types
export interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create Context
export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Custom Hook to use App State
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
