import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Category, categoryApi, getAuthToken } from '../services/apiService';

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  getCategoryTranslation: (categoryName: string, language: string) => string;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

interface CategoriesProviderProps {
  children: ReactNode;
}

export const CategoriesProvider: React.FC<CategoriesProviderProps> = ({ children }) => {
  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getAuthToken();
  });

  // Monitor authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, []);

  const {
    data: categoriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(true), // Include default categories
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  const categories = categoriesData?.categories || [];

  // Function to get translated category name
  const getCategoryTranslation = (categoryName: string, language: string): string => {
    // Find the category by name
    const category = categories.find(cat => cat.name === categoryName);

    if (category?.translations && category.translations[language]) {
      return category.translations[language];
    }

    // Fallback to original name
    return categoryName;
  };

  const value: CategoriesContextType = {
    categories,
    isLoading,
    error: error as Error | null,
    getCategoryTranslation,
  };

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};

export const useCategories = (): CategoriesContextType => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};
