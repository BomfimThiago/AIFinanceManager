/**
 * Hooks Barrel Exports - Clean import interface
 * Groups related hooks for better organization
 */

// Global State Hooks
export { useAppNavigation } from './useAppNavigation';
export { useAppFilters } from './useAppFilters';
export { useAppNotifications } from './useAppNotifications';
export { useUserPreferences } from './useUserPreferences';

// Business Logic Hooks
export { useFinanceOperations } from './useFinanceOperations';

// Data Query Hooks
export * from './queries';

// Feature-Specific Hooks
export { useFileUpload } from './useFileUpload';
export { useBelvoSDK } from './useBelvoSDK';
export { useConsentManagement } from './useConsentManagement';
export { useIntegrations } from './useIntegrations';
export { useNotifications } from './useNotifications';

// Legacy hooks (to be refactored)
export { useBudgets } from './useBudgets';
export { useExpenses } from './useExpenses';
export { usePrivacyMode } from './usePrivacyMode';