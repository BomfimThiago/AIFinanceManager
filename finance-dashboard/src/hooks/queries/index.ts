// Expenses
export {
  useExpenses,
  useExpenseSummary,
  useCategoryChartData,
  useMonthlyChartData,
  useCategorySpending,
  useCreateExpense,
  useCreateBulkExpenses,
  useUploadExpenseFile,
  useUpdateExpense,
  useDeleteExpense,
  expenseKeys,
} from './useExpensesQuery';

// Budgets
export {
  useBudgets,
  useCreateBudget,
  useUpdateBudgetSpent,
  useDeleteBudget,
  budgetKeys,
} from './useBudgetsQuery';

// Insights
export { useGenerateInsights, insightKeys } from './useInsightsQuery';
export { useFinancialReport, financialReportKeys } from './useFinancialReportQuery';

// Upload History
export {
  useUploadHistoryQuery,
  useDeleteUploadHistoryMutation,
  uploadHistoryKeys,
} from './useUploadHistoryQuery';

// Categories
export {
  useCategories,
  useCategoryStats,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAddCategoryPreference,
  categoryKeys,
} from './useCategoriesQuery';

// User Preferences
export {
  useUserPreferences,
  useUpdateUserPreferences,
  useUpdateCurrencyPreference,
  useUpdateLanguagePreference,
  useUpdateUIPreferences,
  userPreferencesKeys,
} from './useUserPreferencesQuery';

// Goals
export {
  useGoals,
  useGoal,
  useActiveGoals,
  useGoalsByType,
  useGoalsSummary,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useUpdateGoalProgress,
  useSetGoalProgress,
  goalKeys,
} from './useGoalsQuery';
