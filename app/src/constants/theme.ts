// src/constants/theme.ts
// Konta Design System - Premium Fintech Theme
import { Platform } from 'react-native';

export const colors = {
  // Primary palette
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Secondary (Cyan)
  secondary: {
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
  },

  // Semantic colors
  success: {
    light: '#DCFCE7',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  danger: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Category colors (for expenses/income)
  category: {
    groceries: '#10B981',
    restaurants: '#EC4899',
    transport: '#3B82F6',
    entertainment: '#F59E0B',
    health: '#EF4444',
    home: '#8B5CF6',
    education: '#06B6D4',
    travel: '#14B8A6',
    utilities: '#6366F1',
    shopping: '#F97316',
    salary: '#10B981',
    freelance: '#3B82F6',
    investments: '#F59E0B',
  },
};

// Light theme
export const lightTheme = {
  background: '#FAFBFF',
  backgroundSecondary: '#F3E8FF',
  surface: 'rgba(255, 255, 255, 0.95)',
  surfaceElevated: '#FFFFFF',
  text: '#1A1D29',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: 'rgba(124, 58, 237, 0.08)',
  borderStrong: 'rgba(124, 58, 237, 0.15)',
  divider: 'rgba(0, 0, 0, 0.05)',
  primary: colors.primary[600],
  primaryLight: colors.primary[100],
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Dark theme
export const darkTheme = {
  background: '#0F0F1A',
  backgroundSecondary: '#1A1A2E',
  surface: 'rgba(26, 26, 46, 0.9)',
  surfaceElevated: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: 'rgba(124, 58, 237, 0.15)',
  borderStrong: 'rgba(124, 58, 237, 0.25)',
  divider: 'rgba(255, 255, 255, 0.08)',
  primary: colors.primary[400],
  primaryLight: 'rgba(124, 58, 237, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Gradients (for use with expo-linear-gradient)
export const gradients = {
  primary: ['#7C3AED', '#A855F7', '#EC4899'],
  primarySimple: ['#7C3AED', '#A855F7'],
  secondary: ['#06B6D4', '#3B82F6'],
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
  gold: ['#F59E0B', '#EF4444'],
  dark: ['#1A1A2E', '#0F0F1A'],
};

// Typography
export const typography = {
  displayXl: { fontSize: 48, fontWeight: '800' as const, letterSpacing: -1 },
  displayLg: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 28, fontWeight: '700' as const },
  displaySm: { fontSize: 24, fontWeight: '700' as const },
  headingLg: { fontSize: 20, fontWeight: '700' as const },
  headingMd: { fontSize: 18, fontWeight: '600' as const },
  headingSm: { fontSize: 16, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// Border radius
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  },
  md: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    web: { boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  },
  lg: {
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 10px 40px rgba(0,0,0,0.15)' },
  },
  primary: {
    ios: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 10px 30px rgba(124,58,237,0.35)' },
  },
};

// Helper to get theme based on dark mode
export const getTheme = (isDark: boolean) => isDark ? darkTheme : lightTheme;

// Helper to get shadow based on platform
export const getShadow = (size: 'sm' | 'md' | 'lg' | 'primary') => {
  const shadow = shadows[size];
  if (Platform.OS === 'ios') return shadow.ios;
  if (Platform.OS === 'android') return shadow.android;
  return shadow.web;
};

// Backward compatibility - THEME object
export const THEME = {
  primary: {
    DEFAULT: colors.primary[600],
    light: colors.primary[400],
    lighter: colors.primary[100],
    dark: colors.primary[700],
    pink: '#EC4899',
  },
  success: {
    DEFAULT: colors.success.main,
    light: colors.success.light,
  },
  warning: {
    DEFAULT: colors.warning.main,
    light: colors.warning.light,
  },
  error: {
    DEFAULT: colors.danger.main,
    light: colors.danger.light,
  },
  info: {
    DEFAULT: colors.info.main,
    light: colors.info.light,
  },
  category: colors.category,
};

// Backward compatibility - GRADIENTS
export const GRADIENTS = gradients;

// Backward compatibility - getThemeColors
export function getThemeColors(isDark: boolean) {
  const theme = getTheme(isDark);
  return {
    // Backgrounds
    background: theme.background,
    backgroundGradientStart: isDark ? '#0F0F1A' : '#FAFBFF',
    backgroundGradientEnd: isDark ? '#1A1A2E' : '#F3E8FF',

    // Surfaces
    surface: theme.surface,
    surfaceSolid: theme.surfaceElevated,
    surfaceSecondary: isDark ? '#252547' : '#F9FAFB',
    surfaceElevated: theme.surfaceElevated,

    // Text
    text: theme.text,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,

    // Borders
    border: theme.border,
    borderSolid: isDark ? '#374151' : '#E5E7EB',
    divider: theme.divider,

    // Primary
    primary: theme.primary,
    primaryLight: theme.primaryLight,

    // Status colors
    success: colors.success.main,
    successLight: isDark ? 'rgba(16,185,129,0.15)' : colors.success.light,
    warning: colors.warning.main,
    warningLight: isDark ? 'rgba(245,158,11,0.15)' : colors.warning.light,
    error: colors.danger.main,
    errorLight: isDark ? 'rgba(239,68,68,0.15)' : colors.danger.light,
    info: colors.info.main,
    infoLight: isDark ? 'rgba(59,130,246,0.15)' : colors.info.light,

    // Input backgrounds
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.05)',

    // Danger colors (alias for error)
    danger: colors.danger.main,
    dangerLight: isDark ? 'rgba(239,68,68,0.15)' : colors.danger.light,
  };
}

// Status configurations for receipts/transactions
export function getStatusConfig(status: string, isDark: boolean) {
  const themeColors = getThemeColors(isDark);
  switch (status) {
    case 'completed':
      return {
        color: themeColors.success,
        bg: themeColors.successLight,
        label: 'Completado',
        icon: '✓',
      };
    case 'processing':
      return {
        color: themeColors.warning,
        bg: themeColors.warningLight,
        label: 'Procesando',
        icon: '⏳',
      };
    case 'failed':
      return {
        color: themeColors.error,
        bg: themeColors.errorLight,
        label: 'Error',
        icon: '✕',
      };
    default:
      return {
        color: themeColors.textMuted,
        bg: isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6',
        label: 'Pendiente',
        icon: '•',
      };
  }
}
