import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import { Category } from '../services/apiService';

interface LanguageContextType {
  selectedLanguage: string;      // User's saved preference
  setSelectedLanguage: (language: string) => void;
  sessionLanguage: string;       // Current viewing language
  setSessionLanguage: (language: string) => void;
  t: (key: string, fallback?: string) => string;
  tCategory: (categoryName: string, categories?: Category[]) => string;  // Helper for category names
  tCategoryDescription: (categoryDescription: string, categoryName: string, categories?: Category[]) => string;  // Helper for category descriptions
  translations: Record<string, any>;
  availableLanguages: Record<string, string>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // User's saved preference (from database)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  
  // Session viewing language (temporary, stored in sessionStorage)
  const [sessionLanguage, setSessionLanguage] = useState<string>(() => {
    return sessionStorage.getItem('sessionLanguage') || 'en';
  });

  // Save session language to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('sessionLanguage', sessionLanguage);
  }, [sessionLanguage]);

  // Fetch available languages
  const { data: availableLanguages = {} } = useQuery({
    queryKey: ['availableLanguages'],
    queryFn: () => apiService.get<Record<string, string>>('/api/translations'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch translations for current session language
  const { data: translationData, isLoading } = useQuery({
    queryKey: ['translations', sessionLanguage],
    queryFn: () => apiService.get<{
      language: string;
      translations: Record<string, any>;
      stats: {
        language: string;
        total_keys: number;
        translated_keys: number;
        missing_keys: number;
        completion_percentage: number;
      };
      last_updated: string | null;
    }>(`/api/translations/${sessionLanguage}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!sessionLanguage,
  });

  const translations = translationData?.translations || {};

  // Translation function with dot notation support
  const t = (key: string, fallback?: string): string => {
    try {
      const keys = key.split('.');
      let value: any = translations;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Key not found, return fallback or key itself
          return fallback || key;
        }
      }
      
      // Return the final value if it's a string
      if (typeof value === 'string') {
        return value;
      }
      
      // If not a string, return fallback or key
      return fallback || key;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return fallback || key;
    }
  };

  // Helper function to translate category names from database
  const tCategory = (categoryName: string, categories?: Category[]): string => {
    try {
      // First, try to find database translations from category object
      if (categories) {
        const category = categories.find(cat => cat.name === categoryName);
        if (category?.translations?.name && category.translations.name[sessionLanguage]) {
          return category.translations.name[sessionLanguage];
        }
      }
      
      // Fallback to static translation in categoryNames section
      const categoryTranslation = translations?.categoryNames?.[categoryName];
      if (categoryTranslation && typeof categoryTranslation === 'string') {
        return categoryTranslation;
      }
      
      // Final fallback to original category name
      return categoryName;
    } catch (error) {
      console.warn(`Category translation error for "${categoryName}":`, error);
      return categoryName;
    }
  };

  // Helper function to translate category descriptions from database
  const tCategoryDescription = (categoryDescription: string, categoryName: string, categories?: Category[]): string => {
    try {
      // Don't translate if no description provided
      if (!categoryDescription) {
        return categoryDescription;
      }

      // First, try to find database translations from category object
      if (categories) {
        const category = categories.find(cat => cat.name === categoryName);
        if (category?.translations?.description && category.translations.description[sessionLanguage]) {
          return category.translations.description[sessionLanguage];
        }
      }
      
      // Fallback to original description (no static translations for descriptions)
      return categoryDescription;
    } catch (error) {
      console.warn(`Category description translation error for "${categoryDescription}":`, error);
      return categoryDescription;
    }
  };

  const value: LanguageContextType = {
    selectedLanguage,
    setSelectedLanguage,
    sessionLanguage,
    setSessionLanguage,
    t,
    tCategory,
    tCategoryDescription,
    translations,
    availableLanguages,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Hook for easy translation access
export const useTranslation = () => {
  const { t, tCategory, tCategoryDescription, isLoading } = useLanguage();
  return { t, tCategory, tCategoryDescription, isLoading };
};

// Hook for translation with categories context
export const useCategoryTranslation = (categories: Category[]) => {
  const { t, tCategory, tCategoryDescription, isLoading } = useLanguage();
  const translateCategory = (categoryName: string) => tCategory(categoryName, categories);
  const translateCategoryDescription = (categoryDescription: string, categoryName: string) => 
    tCategoryDescription(categoryDescription, categoryName, categories);
  return { 
    t, 
    tCategory: translateCategory, 
    tCategoryDescription: translateCategoryDescription, 
    isLoading 
  };
};