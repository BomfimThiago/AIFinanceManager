import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { apiService, getAuthToken } from '../services/apiService';
import { Category } from '../services/apiService';

interface LanguageContextType {
  selectedLanguage: string; // User's saved preference
  setSelectedLanguage: (language: string) => void;
  sessionLanguage: string; // Current viewing language
  setSessionLanguage: (language: string) => void;
  t: (key: string, fallback?: string) => string;
  tCategory: (categoryName: string, categories?: Category[]) => string; // Helper for category names
  tCategoryDescription: (
    categoryDescription: string,
    categoryName: string,
    categories?: Category[]
  ) => string; // Helper for category descriptions
  translations: Record<string, any>;
  availableLanguages: Record<string, string>;
  isLoading: boolean;
  // Date formatting functions
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatShortDate: (date: Date | string) => string;
  formatLongDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatRelativeDate: (date: Date | string) => string;
  getLocale: () => string;
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

  // Save session language to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('sessionLanguage', sessionLanguage);
  }, [sessionLanguage]);

  // Fetch available languages (only when authenticated)
  const { data: availableLanguages = {} } = useQuery({
    queryKey: ['availableLanguages'],
    queryFn: () => apiService.get<Record<string, string>>('/api/translations'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: isAuthenticated,
  });

  // Fetch translations for current session language (only when authenticated)
  const { data: translationData, isLoading } = useQuery({
    queryKey: ['translations', sessionLanguage],
    queryFn: () =>
      apiService.get<{
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
    enabled: isAuthenticated && !!sessionLanguage,
  });

  // Fallback translations for unauthenticated state (login/signup page)
  const fallbackTranslations = {
    en: {
      auth: {
        login: 'Login',
        signup: 'Sign Up',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        username: 'Username',
        loginToAccount: 'Login to your account',
        createAccount: 'Create your account',
        dontHaveAccount: "Don't have an account?",
        alreadyHaveAccount: 'Already have an account?',
        signUpHere: 'Sign up here',
        loginHere: 'Login here',
        pleaseFieldsAll: 'Please fill in all fields',
        passwordsNoMatch: 'Passwords do not match',
        loginSuccessMessage: 'Login successful!',
        signupSuccessMessage: 'Account created successfully!',
        loggingIn: 'Logging in...',
        signingUp: 'Signing up...',
      },
    },
    es: {
      auth: {
        login: 'Iniciar Sesión',
        signup: 'Registrarse',
        email: 'Correo',
        password: 'Contraseña',
        confirmPassword: 'Confirmar Contraseña',
        username: 'Usuario',
        loginToAccount: 'Inicia sesión en tu cuenta',
        createAccount: 'Crea tu cuenta',
        dontHaveAccount: '¿No tienes cuenta?',
        alreadyHaveAccount: '¿Ya tienes cuenta?',
        signUpHere: 'Regístrate aquí',
        loginHere: 'Inicia sesión aquí',
        pleaseFieldsAll: 'Por favor completa todos los campos',
        passwordsNoMatch: 'Las contraseñas no coinciden',
        loginSuccessMessage: '¡Inicio de sesión exitoso!',
        signupSuccessMessage: '¡Cuenta creada exitosamente!',
        loggingIn: 'Iniciando sesión...',
        signingUp: 'Registrando...',
      },
    },
    pt: {
      auth: {
        login: 'Entrar',
        signup: 'Cadastrar',
        email: 'Email',
        password: 'Senha',
        confirmPassword: 'Confirmar Senha',
        username: 'Usuário',
        loginToAccount: 'Entre na sua conta',
        createAccount: 'Crie sua conta',
        dontHaveAccount: 'Não tem conta?',
        alreadyHaveAccount: 'Já tem conta?',
        signUpHere: 'Cadastre-se aqui',
        loginHere: 'Entre aqui',
        pleaseFieldsAll: 'Por favor preencha todos os campos',
        passwordsNoMatch: 'As senhas não coincidem',
        loginSuccessMessage: 'Login realizado com sucesso!',
        signupSuccessMessage: 'Conta criada com sucesso!',
        loggingIn: 'Entrando...',
        signingUp: 'Cadastrando...',
      },
    },
  };

  const translations = isAuthenticated
    ? translationData?.translations || {}
    : fallbackTranslations[sessionLanguage as keyof typeof fallbackTranslations] ||
      fallbackTranslations.en;

  // Locale mapping for date formatting
  const getLocale = (): string => {
    switch (sessionLanguage) {
      case 'en':
        return 'en-US';
      case 'es':
        return 'es-ES';
      case 'pt':
        return 'pt-BR'; // Brazilian Portuguese
      default:
        return 'en-US';
    }
  };

  // Helper to parse date strings or Date objects
  const parseDate = (date: Date | string): Date => {
    if (date instanceof Date) return date;
    return new Date(date);
  };

  // Format date with custom options
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const dateObj = parseDate(date);
      const locale = getLocale();
      return dateObj.toLocaleDateString(locale, options);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return String(date);
    }
  };

  // Short date format (e.g., 12/31/2023, 31/12/2023, 31/12/2023)
  const formatShortDate = (date: Date | string): string => {
    return formatDate(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Long date format (e.g., December 31, 2023, 31 de dezembro de 2023)
  const formatLongDate = (date: Date | string): string => {
    return formatDate(date, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Date and time format
  const formatDateTime = (date: Date | string): string => {
    try {
      const dateObj = parseDate(date);
      const locale = getLocale();
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('DateTime formatting error:', error);
      return String(date);
    }
  };

  // Relative date format (e.g., "2 days ago", "hace 2 días")
  const formatRelativeDate = (date: Date | string): string => {
    try {
      const dateObj = parseDate(date);
      const locale = getLocale();
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Use Intl.RelativeTimeFormat for proper localization
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (diffInDays === 0) {
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours === 0) {
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          return rtf.format(-diffInMinutes, 'minute');
        }
        return rtf.format(-diffInHours, 'hour');
      } else if (diffInDays < 7) {
        return rtf.format(-diffInDays, 'day');
      } else if (diffInDays < 30) {
        const diffInWeeks = Math.floor(diffInDays / 7);
        return rtf.format(-diffInWeeks, 'week');
      } else if (diffInDays < 365) {
        const diffInMonths = Math.floor(diffInDays / 30);
        return rtf.format(-diffInMonths, 'month');
      } else {
        const diffInYears = Math.floor(diffInDays / 365);
        return rtf.format(-diffInYears, 'year');
      }
    } catch (error) {
      console.warn('Relative date formatting error:', error);
      return formatShortDate(date);
    }
  };

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
      // Don't translate empty or null names
      if (!categoryName || categoryName.trim() === '') {
        return categoryName;
      }

      // BULLETPROOF APPROACH: If we have categories context, check if this is a system category
      if (categories) {
        const category = categories.find(cat => cat.name === categoryName);

        if (category) {
          // For system categories (is_default = true), always try translations
          if (category.is_default) {
            // First try database translations
            if (category.translations?.name && category.translations.name[sessionLanguage]) {
              return category.translations.name[sessionLanguage];
            }

            // Then try static translations
            const categoryTranslation = translations?.categoryNames?.[categoryName];
            if (categoryTranslation && typeof categoryTranslation === 'string') {
              return categoryTranslation;
            }

            // If no translation found, return original name
            return categoryName;
          }

          // For custom categories (is_default = false), check if they have database translations
          if (!category.is_default) {
            // First try database translations from the category itself
            if (category.translations?.name && category.translations.name[sessionLanguage]) {
              return category.translations.name[sessionLanguage];
            }

            // For custom categories, also check if the name matches any static translations
            // This allows users who create categories like "Food", "Transport" to get translations
            const categoryTranslation = translations?.categoryNames?.[categoryName];
            if (categoryTranslation && typeof categoryTranslation === 'string') {
              return categoryTranslation;
            }

            // If no translation found, return original name (user's custom name)
            return categoryName;
          }
        }
      }

      // Fallback logic when we don't have categories context (should rarely happen)
      // Only translate known system categories
      const knownSystemCategories = [
        'Food',
        'Transport',
        'Shopping',
        'Entertainment',
        'Utilities',
        'Healthcare',
        'Education',
        'Home',
        'Clothing',
        'Technology',
        'Fitness',
        'Travel',
        'Gifts',
        'Pets',
        'Other',
      ];

      if (knownSystemCategories.includes(categoryName)) {
        const categoryTranslation = translations?.categoryNames?.[categoryName];
        if (categoryTranslation && typeof categoryTranslation === 'string') {
          return categoryTranslation;
        }
      }

      // For everything else, return the raw name
      return categoryName;
    } catch (error) {
      console.warn(`Category translation error for "${categoryName}":`, error);
      return categoryName;
    }
  };

  // Helper function to translate category descriptions from database
  const tCategoryDescription = (
    categoryDescription: string,
    categoryName: string,
    categories?: Category[]
  ): string => {
    try {
      // Don't translate if no description provided
      if (!categoryDescription || categoryDescription.trim() === '') {
        return categoryDescription;
      }

      // First, try to find database translations from category object
      if (categories) {
        const category = categories.find(cat => cat.name === categoryName);
        if (
          category?.translations?.description &&
          category.translations.description[sessionLanguage]
        ) {
          const translatedDescription = category.translations.description[sessionLanguage];
          // Don't use translation if it would result in generic fallbacks
          if (
            translatedDescription &&
            translatedDescription.toLowerCase() !== 'uncategorized' &&
            translatedDescription.toLowerCase() !== 'sin categoría' &&
            translatedDescription.toLowerCase() !== 'sem categoria' &&
            translatedDescription.toLowerCase() !== 'no description' &&
            translatedDescription.toLowerCase() !== 'sin descripción' &&
            translatedDescription.toLowerCase() !== 'sem descrição'
          ) {
            return translatedDescription;
          }
        }
      }

      // Fallback to original description (always prefer raw description over generic fallbacks)
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
    // Date formatting functions
    formatDate,
    formatShortDate,
    formatLongDate,
    formatDateTime,
    formatRelativeDate,
    getLocale,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
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
  const {
    t,
    tCategory,
    tCategoryDescription,
    isLoading,
    formatDate,
    formatShortDate,
    formatLongDate,
    formatDateTime,
    formatRelativeDate,
    getLocale,
  } = useLanguage();
  return {
    t,
    tCategory,
    tCategoryDescription,
    isLoading,
    formatDate,
    formatShortDate,
    formatLongDate,
    formatDateTime,
    formatRelativeDate,
    getLocale,
  };
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
    isLoading,
  };
};
