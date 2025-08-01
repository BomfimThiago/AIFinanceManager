/**
 * Budget Helper Functions
 * Utilities for transforming budget data between API and component formats
 */

import type { Budgets, Budget } from '../types';

/**
 * Transforms API budget response to component Budgets format
 */
export function transformApiBudgetsToBudgets(
  apiBudgets: Record<string, { limit: number; spent: number }>
): Budgets {
  const budgets: Budgets = {};
  
  Object.entries(apiBudgets).forEach(([category, data]) => {
    budgets[category] = {
      category,
      limit: data.limit,
      spent: data.spent,
    };
  });
  
  return budgets;
}

/**
 * Transforms component Budgets format to API format
 */
export function transformBudgetsToApi(
  budgets: Budgets
): Record<string, { limit: number; spent: number }> {
  const apiBudgets: Record<string, { limit: number; spent: number }> = {};
  
  Object.entries(budgets).forEach(([category, budget]) => {
    apiBudgets[category] = {
      limit: budget.limit,
      spent: budget.spent,
    };
  });
  
  return apiBudgets;
}