import React, { createContext, useContext, useEffect } from 'react';
import { useUserPreferences, useUpdateUserPreferences } from '../hooks/queries';
import { UserPreferences, UserPreferencesUpdate } from '../services/apiService';
import { useCurrency } from './CurrencyContext';
import { useNotificationContext } from './NotificationContext';
import { useAuth } from './AuthContext';

interface UserPreferencesContextType {
  preferences: UserPreferences | null;
  availableCurrencies: string[];
  availableLanguages: Array<{
    code: string;
    label: string;
    native_label: string;
  }>;
  isLoading: boolean;
  updatePreferences: (preferences: UserPreferencesUpdate) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferencesContext = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferencesContext must be used within UserPreferencesProvider');
  }
  return context;
};

interface UserPreferencesProviderProps {
  children: React.ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useUserPreferences(isAuthenticated);
  const updateMutation = useUpdateUserPreferences();
  const { setSelectedCurrency } = useCurrency();
  const { showSuccess, showError } = useNotificationContext();

  // Sync currency preference with Currency context when preferences load
  useEffect(() => {
    if (data?.preferences?.default_currency) {
      setSelectedCurrency(data.preferences.default_currency);
    }
  }, [data?.preferences?.default_currency, setSelectedCurrency]);

  const updatePreferences = async (preferences: UserPreferencesUpdate) => {
    try {
      await updateMutation.mutateAsync(preferences);
      showSuccess('Preferences Updated', 'Your preferences have been saved successfully');
      
      // If currency was updated, sync with Currency context
      if (preferences.default_currency) {
        setSelectedCurrency(preferences.default_currency);
      }
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      showError('Update Failed', 'Failed to update preferences. Please try again.');
      throw error;
    }
  };

  const value: UserPreferencesContextType = {
    preferences: data?.preferences || null,
    availableCurrencies: data?.available_currencies || ['USD', 'EUR', 'BRL'],
    availableLanguages: data?.available_languages || [
      { code: 'en', label: 'English', native_label: 'English' },
      { code: 'es', label: 'Spanish', native_label: 'Español' },
      { code: 'pt', label: 'Portuguese', native_label: 'Português' },
    ],
    isLoading,
    updatePreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export default UserPreferencesProvider;