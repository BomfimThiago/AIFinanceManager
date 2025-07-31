import React, { useCallback, useState } from 'react';

import { CreditCard, RefreshCw, Target, TrendingUp, Wallet } from 'lucide-react';

import { useCurrency } from '../../contexts/CurrencyContext';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useCategoryChartData, useExpenseSummary, useMonthlyChartData } from '../../hooks/queries';
import { Budgets, Expense } from '../../types';
import { getExpenseAmountInCurrency } from '../../utils/currencyHelpers';
import InteractiveExpenseFlow from '../charts/InteractiveExpenseFlow';
import InteractiveSpendingTimeline from '../charts/InteractiveSpendingTimeline';
import SpendingHeatmap from '../charts/SpendingHeatmap';
import SummaryCard from '../ui/SummaryCard';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budgets;
  hideAmounts: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets, hideAmounts }) => {
  const {
    formatAmount: formatCurrencyAmount,
    convertAmount,
    sessionCurrency,
    exchangeRates,
    currencies,
  } = useCurrency();
  const { filters, clearFilters } = useGlobalFilters();
  const { t } = useTranslation();

  // Dashboard interaction state
  const [dashboardState, setDashboardState] = useState({
    selectedCategory: null as string | null,
    selectedTimeRange: null as { start: string; end: string } | null,
    selectedDate: null as string | null,
  });

  // Chart interaction handlers
  const handleCategoryClick = useCallback((category: string) => {
    setDashboardState(prev => ({
      ...prev,
      selectedCategory: category,
    }));
  }, []);

  const handleTimeRangeSelect = useCallback((startDate: string, endDate: string) => {
    setDashboardState(prev => ({
      ...prev,
      selectedTimeRange: { start: startDate, end: endDate },
    }));
  }, []);

  const handleDateClick = useCallback((date: string) => {
    setDashboardState(prev => ({
      ...prev,
      selectedDate: date,
    }));
  }, []);

  const resetDashboardFilters = useCallback(() => {
    setDashboardState({
      selectedCategory: null,
      selectedTimeRange: null,
      selectedDate: null,
    });
    clearFilters();
  }, [clearFilters]);

  // TanStack Query hooks
  const { isLoading: summaryLoading, error: summaryError } = useExpenseSummary();

  const {
    data: categoryData = [],
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryChartData();

  const {
    data: monthlyData = [],
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useMonthlyChartData();

  // Helper function to convert expense amounts to session currency
  const getConvertedAmount = (expense: Expense) => {
    return getExpenseAmountInCurrency(expense, sessionCurrency, convertAmount);
  };

  // Get conversion rates for display
  const getConversionRateDisplay = () => {
    if (sessionCurrency === 'EUR') return null; // No conversion needed for base currency

    const rate = exchangeRates[sessionCurrency];
    if (!rate) return null;

    const currencyInfo = currencies[sessionCurrency];
    return `1 EUR = ${rate.toFixed(4)} ${currencyInfo?.symbol || sessionCurrency}`;
  };

  // Calculate totals in selected currency from expenses
  const localTotalIncome = expenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

  const localTotalExpenses = expenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

  const localNetAmount = localTotalIncome - localTotalExpenses;

  // Use local calculations since they're now currency-aware
  // Note: API summary data is in original currencies, so we use local calculations
  const totalIncome = localTotalIncome;
  const totalExpenses = localTotalExpenses;
  const netAmount = localNetAmount;

  // Combined loading state
  const loading = summaryLoading || categoryLoading || monthlyLoading;

  // Combined error state
  const hasError = summaryError || categoryError || monthlyError;
  const errorMessage = hasError ? t('dashboard.loadingError') : null;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    value => value !== undefined && value !== null && value !== ''
  );
  const hasActiveDashboardState =
    dashboardState.selectedCategory ||
    dashboardState.selectedTimeRange ||
    dashboardState.selectedDate;

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Banner */}
      {(hasActiveFilters || hasActiveDashboardState) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-700">
                <span className="font-medium">{t('dashboard.activeFilters')}:</span>
                {filters.category && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md">
                    {t('dashboard.filterCategory')}: {filters.category}
                  </span>
                )}
                {filters.type && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md">
                    {t('dashboard.filterType')}: {filters.type}
                  </span>
                )}
                {filters.startDate && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md">
                    {t('dashboard.filterFrom')}: {filters.startDate}
                  </span>
                )}
                {filters.endDate && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md">
                    {t('dashboard.filterTo')}: {filters.endDate}
                  </span>
                )}
                {filters.search && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 rounded-md">
                    {t('dashboard.filterSearch')}: "{filters.search}"
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={resetDashboardFilters}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">{t('dashboard.clearAll')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Currency Conversion Notice */}
      {sessionCurrency !== 'EUR' && getConversionRateDisplay() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="text-xs text-blue-700">
              <span className="font-medium">{t('dashboard.currencyConversion')}:</span>{' '}
              {t('dashboard.usingCurrentRates')} - {getConversionRateDisplay()}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title={t('dashboard.totalIncome')}
          value={hideAmounts ? '***' : formatCurrencyAmount(totalIncome)}
          icon={TrendingUp}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />

        <SummaryCard
          title={t('dashboard.totalExpenses')}
          value={hideAmounts ? '***' : formatCurrencyAmount(totalExpenses)}
          icon={CreditCard}
          bgColor="bg-red-100"
          textColor="text-red-600"
        />

        <SummaryCard
          title={t('dashboard.netSavings')}
          value={
            hideAmounts
              ? '***'
              : `${netAmount >= 0 ? '+' : ''}${formatCurrencyAmount(Math.abs(netAmount))}`
          }
          icon={Wallet}
          bgColor={netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}
          textColor={netAmount >= 0 ? 'text-green-600' : 'text-red-600'}
        />

        <SummaryCard
          title={t('dashboard.activeBudgets')}
          value={Object.keys(budgets).length}
          icon={Target}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
      </div>

      {/* Interactive Charts */}
      <div className="space-y-8">
        {/* Top Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InteractiveSpendingTimeline
            expenses={expenses}
            onTimeRangeSelect={handleTimeRangeSelect}
          />
          <InteractiveExpenseFlow expenses={expenses} onCategoryClick={handleCategoryClick} />
        </div>

        {/* Heatmap Chart */}
        <div className="grid grid-cols-1 gap-8">
          <SpendingHeatmap expenses={expenses} onDateClick={handleDateClick} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
