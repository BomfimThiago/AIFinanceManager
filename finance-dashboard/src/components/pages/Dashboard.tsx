/**
 * Refactored Dashboard Component - Pure UI presentation
 * Follows Container/Presenter pattern with separated business logic
 */
import React from 'react';

import { CreditCard, Target, TrendingUp, Wallet } from 'lucide-react';

import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import type { Budgets, Expense } from '../../types';
import { filterExpenses, getFilterSummary } from '../../utils/expenseFilters';
// UI Components
import InteractiveExpenseFlow from '../charts/InteractiveExpenseFlow';
import SummaryCard from '../ui/SummaryCard';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budgets;
  hideAmounts: boolean;
}

// Loading Component
const DashboardLoading: React.FC = () => (
  <div className="space-y-8">
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  </div>
);

// Error Component
const DashboardError: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
        <div className="mt-2 text-sm text-yellow-700">
          <p>{message}</p>
        </div>
      </div>
    </div>
  </div>
);

// Summary Cards Component
const SummaryCards: React.FC<{
  calculations: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    budgetCount: number;
  };
  hideAmounts: boolean;
  currency: string;
}> = ({ calculations, hideAmounts, currency }) => {
  const { t } = useTranslation();
  const formatAmount = (amount: number) => {
    if (hideAmounts) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title={t('dashboard.totalIncome')}
        value={formatAmount(calculations.totalIncome)}
        icon={TrendingUp}
        trend={calculations.totalIncome > 0 ? 'positive' : 'neutral'}
        className="bg-green-50 border-green-200"
      />
      <SummaryCard
        title={t('dashboard.totalExpenses')}
        value={formatAmount(calculations.totalExpenses)}
        icon={CreditCard}
        trend={calculations.totalExpenses > 0 ? 'negative' : 'neutral'}
        className="bg-red-50 border-red-200"
      />
      <SummaryCard
        title={t('dashboard.netAmount')}
        value={formatAmount(calculations.netAmount)}
        icon={Wallet}
        trend={
          calculations.netAmount > 0
            ? 'positive'
            : calculations.netAmount < 0
              ? 'negative'
              : 'neutral'
        }
        className={
          calculations.netAmount > 0
            ? 'bg-green-50 border-green-200'
            : calculations.netAmount < 0
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
        }
      />
      <SummaryCard
        title={t('dashboard.activeGoals')}
        value={calculations.budgetCount.toString()}
        icon={Target}
        trend="neutral"
        className="bg-blue-50 border-blue-200"
      />
    </div>
  );
};

// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets, hideAmounts }) => {
  const { t } = useTranslation();
  const { currency } = useUserPreferences();
  const { filters } = useGlobalFilters();

  // Filter expenses based on global filters
  const filteredExpenses = filterExpenses(expenses, filters);
  const filterSummary = getFilterSummary(filters, expenses.length, filteredExpenses.length);
  const { calculations, isLoading, hasError, errorMessage } = useDashboardData(
    filteredExpenses,
    budgets
  );

  // Early returns for loading and error states
  if (isLoading) {
    return <DashboardLoading />;
  }

  if (hasError && errorMessage) {
    return <DashboardError message={errorMessage} />;
  }

  // Simple JSX - only summary cards and pie chart
  return (
    <div className="space-y-8">
      {/* Global Filter Status */}
      {filterSummary.hasFilters && (
        <div className="mb-6 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Showing {filterSummary.filteredCount} of {filterSummary.totalCount} transactions
              </p>
              {filterSummary.description && (
                <p className="text-xs text-green-600 mt-1">
                  Filtered by: {filterSummary.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards calculations={calculations} hideAmounts={hideAmounts} currency={currency} />

      {/* Spending by Category (Pie Chart Only) */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t('dashboard.spendingByCategory')}
        </h3>
        <InteractiveExpenseFlow expenses={filteredExpenses || []} />
      </div>
    </div>
  );
};

export default Dashboard;
