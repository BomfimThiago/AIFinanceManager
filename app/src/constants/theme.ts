// Konta Theme Colors - Shared across all screens
// Based on the beautiful purple gradient design system

export const THEME = {
  // Primary gradient colors
  primary: {
    DEFAULT: '#7C3AED',
    light: '#A855F7',
    lighter: '#EDE9FE',
    dark: '#6D28D9',
    pink: '#EC4899',
  },

  // Semantic colors
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
  },

  // Category colors
  category: {
    groceries: '#10B981',
    dining: '#EC4899',
    transportation: '#3B82F6',
    entertainment: '#F59E0B',
    healthcare: '#EF4444',
    housing: '#8B5CF6',
    education: '#06B6D4',
    other: '#6B7280',
  },
};

// Gradient strings for use in LinearGradient components
export const GRADIENTS = {
  primary: ['#7C3AED', '#A855F7'],
  primaryFull: ['#7C3AED', '#A855F7', '#EC4899'],
  success: ['#10B981', '#059669'],
  info: ['#3B82F6', '#1D4ED8'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626'],
};

// Get theme colors based on dark mode
export function getThemeColors(isDark: boolean) {
  return {
    // Backgrounds
    background: isDark ? '#0F0F1A' : '#FAFBFF',
    backgroundGradientStart: isDark ? '#0F0F1A' : '#FAFBFF',
    backgroundGradientEnd: isDark ? '#1A1A2E' : '#F3E8FF',

    // Surfaces
    surface: isDark ? 'rgba(26,26,46,0.9)' : 'rgba(255,255,255,0.95)',
    surfaceSolid: isDark ? '#1A1A2E' : '#FFFFFF',

    // Text
    text: isDark ? '#F9FAFB' : '#1A1D29',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textMuted: isDark ? '#6B7280' : '#9CA3AF',

    // Borders
    border: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)',
    borderSolid: isDark ? '#374151' : '#E5E7EB',
    divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',

    // Primary
    primary: THEME.primary.DEFAULT,
    primaryLight: isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE',

    // Status colors
    success: THEME.success.DEFAULT,
    successLight: isDark ? 'rgba(16,185,129,0.15)' : THEME.success.light,
    warning: THEME.warning.DEFAULT,
    warningLight: isDark ? 'rgba(245,158,11,0.15)' : THEME.warning.light,
    error: THEME.error.DEFAULT,
    errorLight: isDark ? 'rgba(239,68,68,0.15)' : THEME.error.light,
    info: THEME.info.DEFAULT,
    infoLight: isDark ? 'rgba(59,130,246,0.15)' : THEME.info.light,

    // Input backgrounds
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.05)',

    // Additional surface variants for backwards compatibility
    surfaceSecondary: isDark ? '#252547' : '#F9FAFB',
    surfaceSolid: isDark ? '#1A1A2E' : '#FFFFFF',

    // Danger colors (alias for error)
    danger: THEME.error.DEFAULT,
    dangerLight: isDark ? 'rgba(239,68,68,0.15)' : THEME.error.light,
  };
}

// Status configurations for receipts/transactions
export function getStatusConfig(status: string, isDark: boolean) {
  const colors = getThemeColors(isDark);
  switch (status) {
    case 'completed':
      return {
        color: colors.success,
        bg: colors.successLight,
        label: 'Completado',
        icon: '✓',
      };
    case 'processing':
      return {
        color: colors.warning,
        bg: colors.warningLight,
        label: 'Procesando',
        icon: '⏳',
      };
    case 'failed':
      return {
        color: colors.error,
        bg: colors.errorLight,
        label: 'Error',
        icon: '✕',
      };
    default:
      return {
        color: colors.textMuted,
        bg: isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6',
        label: 'Pendiente',
        icon: '•',
      };
  }
}
