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
  isChangingLanguage: boolean; // New field to track language changes
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
  const { data: translationData, isLoading, isFetching } = useQuery({
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
    // Keep previous data while fetching new language to prevent flickering
    placeholderData: (previousData) => previousData,
  });

  // Enhanced fallback translations for better initial loading experience
  const fallbackTranslations = {
    en: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        close: 'Close',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        create: 'Create',
        update: 'Update',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        refresh: 'Refresh',
        clear: 'Clear',
        name: 'Name',
        description: 'Description',
        amount: 'Amount',
        date: 'Date',
        category: 'Category',
        total: 'Total',
        income: 'Income',
        expense: 'Expense',
        balance: 'Balance',
        currency: 'Currency',
        selected: 'selected',
      },
      navigation: {
        dashboard: 'Dashboard',
        upload: 'Upload',
        expenses: 'Expenses',
        goals: 'Goals',
        categories: 'Categories',
        insights: 'AI Insights',
        integrations: 'Integrations',
        financialOverview: 'Analytics',
      },
      header: {
        title: 'Konta',
        preferences: 'Preferences',
        signOut: 'Sign out',
        hideAmounts: 'Hide amounts',
        showAmounts: 'Show amounts',
      },
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
      categories: {
        title: 'Category Management',
        categoryType: 'Category Type',
        expense: 'Expense',
        income: 'Income',
        defaultExpenseCategories: 'Default Expense Categories',
        defaultIncomeCategories: 'Default Income Categories',
        customCategories: 'Your Custom Categories',
        addCategory: 'Add Category',
        addNewCategory: 'Add New Category',
        editCategory: 'Edit Category',
        deleteCategory: 'Delete Category',
        categoryName: 'Category Name',
        loading: 'Loading categories...',
        system: 'System',
      },
      dashboard: {
        title: 'Financial Overview',
        totalExpenses: 'Total Expenses',
        totalIncome: 'Total Income',
        netSavings: 'Net Savings',
        totalGoals: 'Total Goals',
      },
    },
    es: {
      common: {
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Agregar',
        close: 'Cerrar',
        confirm: 'Confirmar',
        yes: 'Sí',
        no: 'No',
        ok: 'OK',
        back: 'Volver',
        next: 'Siguiente',
        submit: 'Enviar',
        create: 'Crear',
        update: 'Actualizar',
        view: 'Ver',
        search: 'Buscar',
        filter: 'Filtrar',
        refresh: 'Actualizar',
        clear: 'Limpiar',
        name: 'Nombre',
        description: 'Descripción',
        amount: 'Monto',
        date: 'Fecha',
        category: 'Categoría',
        total: 'Total',
        income: 'Ingreso',
        expense: 'Gasto',
        balance: 'Balance',
        currency: 'Moneda',
        selected: 'seleccionado',
      },
      navigation: {
        dashboard: 'Panel',
        upload: 'Subir',
        expenses: 'Gastos',
        goals: 'Objetivos',
        categories: 'Categorías',
        insights: 'Análisis IA',
        integrations: 'Integraciones',
        financialOverview: 'Análisis',
      },
      header: {
        title: 'Konta',
        preferences: 'Preferencias',
        signOut: 'Cerrar sesión',
        hideAmounts: 'Ocultar montos',
        showAmounts: 'Mostrar montos',
      },
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
      categories: {
        title: 'Gestión de Categorías',
        categoryType: 'Tipo de Categoría',
        expense: 'Gasto',
        income: 'Ingreso',
        defaultExpenseCategories: 'Categorías de Gastos por Defecto',
        defaultIncomeCategories: 'Categorías de Ingresos por Defecto',
        customCategories: 'Tus Categorías Personalizadas',
        addCategory: 'Agregar Categoría',
        addNewCategory: 'Agregar Nueva Categoría',
        editCategory: 'Editar Categoría',
        deleteCategory: 'Eliminar Categoría',
        categoryName: 'Nombre de Categoría',
        loading: 'Cargando categorías...',
        system: 'Sistema',
      },
      dashboard: {
        title: 'Resumen Financiero',
        totalExpenses: 'Gastos Totales',
        totalIncome: 'Ingresos Totales',
        netSavings: 'Ahorros Netos',
        totalGoals: 'Objetivos Totales',
      },
    },
    pt: {
      common: {
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        cancel: 'Cancelar',
        save: 'Salvar',
        delete: 'Excluir',
        edit: 'Editar',
        add: 'Adicionar',
        close: 'Fechar',
        confirm: 'Confirmar',
        yes: 'Sim',
        no: 'Não',
        ok: 'OK',
        back: 'Voltar',
        next: 'Próximo',
        submit: 'Enviar',
        create: 'Criar',
        update: 'Atualizar',
        view: 'Visualizar',
        search: 'Buscar',
        filter: 'Filtrar',
        refresh: 'Atualizar',
        clear: 'Limpar',
        name: 'Nome',
        description: 'Descrição',
        amount: 'Valor',
        date: 'Data',
        category: 'Categoria',
        total: 'Total',
        income: 'Receita',
        expense: 'Despesa',
        balance: 'Saldo',
        currency: 'Moeda',
        selected: 'selecionado',
      },
      navigation: {
        dashboard: 'Painel',
        upload: 'Upload',
        expenses: 'Despesas',
        goals: 'Objetivos',
        categories: 'Categorias',
        insights: 'Análise IA',
        integrations: 'Integrações',
        financialOverview: 'Análises',
      },
      header: {
        title: 'Konta',
        preferences: 'Preferências',
        signOut: 'Sair',
        hideAmounts: 'Ocultar valores',
        showAmounts: 'Mostrar valores',
      },
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
      categories: {
        title: 'Gestão de Categorias',
        categoryType: 'Tipo de Categoria',
        expense: 'Despesa',
        income: 'Receita',
        defaultExpenseCategories: 'Categorias de Despesas Padrão',
        defaultIncomeCategories: 'Categorias de Receitas Padrão',
        customCategories: 'Suas Categorias Personalizadas',
        addCategory: 'Adicionar Categoria',
        addNewCategory: 'Adicionar Nova Categoria',
        editCategory: 'Editar Categoria',
        deleteCategory: 'Excluir Categoria',
        categoryName: 'Nome da Categoria',
        loading: 'Carregando categorias...',
        system: 'Sistema',
      },
      dashboard: {
        title: 'Resumo Financeiro',
        totalExpenses: 'Despesas Totais',
        totalIncome: 'Receitas Totais',    
        netSavings: 'Economia Líquida',
        totalGoals: 'Objetivos Totais',
      },
    },
  };

  // Smart translation merging: Use fallbacks during loading and merge with API data when available
  const translations = React.useMemo(() => {
    const fallback = fallbackTranslations[sessionLanguage as keyof typeof fallbackTranslations] || fallbackTranslations.en;
    
    if (!isAuthenticated) {
      return fallback;
    }
    
    // If we're loading translations for the first time, use fallbacks
    if (isLoading && !translationData) {
      return fallback;
    }
    
    // If we have API translations, merge them with fallbacks (API takes priority)
    if (translationData?.translations) {
      return {
        ...fallback,
        ...translationData.translations,
      };
    }
    
    // Fallback to client-side translations during loading
    return fallback;
  }, [isAuthenticated, translationData, isLoading, sessionLanguage]);

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
    // Only show loading for initial load, not for language switches
    isLoading: isAuthenticated && isLoading && !translationData,
    // Track when language is changing to prevent flickering
    isChangingLanguage: isAuthenticated && isFetching && !!translationData,
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
  const { t, tCategory, tCategoryDescription, isLoading, isChangingLanguage } = useLanguage();
  const translateCategory = (categoryName: string) => tCategory(categoryName, categories);
  const translateCategoryDescription = (categoryDescription: string, categoryName: string) =>
    tCategoryDescription(categoryDescription, categoryName, categories);
  return {
    t,
    tCategory: translateCategory,
    tCategoryDescription: translateCategoryDescription,
    isLoading,
    isChangingLanguage,
  };
};
