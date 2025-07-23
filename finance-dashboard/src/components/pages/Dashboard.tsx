import React from 'react';
import { TrendingUp, CreditCard, Wallet, Target } from 'lucide-react';
import SummaryCard from '../ui/SummaryCard';
import { LineChartComponent, PieChartComponent } from '../ui/Chart';
import { Expense, Budgets } from '../../types';
import { useExpenseSummary, useCategoryChartData, useMonthlyChartData } from '../../hooks/queries';
import { useCurrency } from '../../contexts/CurrencyContext';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budgets;
  hideAmounts: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets, hideAmounts }) => {
  const { formatAmount: formatCurrencyAmount, convertAmount, selectedCurrency, exchangeRates, currencies } = useCurrency();

  // TanStack Query hooks
  const {
    isLoading: summaryLoading,
    error: summaryError
  } = useExpenseSummary();

  const {
    data: categoryData = [],
    isLoading: categoryLoading,
    error: categoryError
  } = useCategoryChartData();

  const {
    data: monthlyData = [],
    isLoading: monthlyLoading,
    error: monthlyError
  } = useMonthlyChartData();

  // Helper function to convert expense amounts to selected currency
  const getConvertedAmount = (expense: Expense) => {
    // If expense has pre-calculated amounts for the selected currency, use that
    if (expense.amounts && expense.amounts[selectedCurrency]) {
      return expense.amounts[selectedCurrency];
    }
    // Otherwise, convert using current rates (assuming EUR as original currency for older data)
    const originalCurrency = expense.original_currency || 'EUR';
    return convertAmount(expense.amount, originalCurrency);
  };

  // Get conversion rates for display
  const getConversionRateDisplay = () => {
    if (selectedCurrency === 'EUR') return null; // No conversion needed for base currency
    
    const rate = exchangeRates[selectedCurrency];
    if (!rate) return null;
    
    const currencyInfo = currencies[selectedCurrency];
    return `1 EUR = ${rate.toFixed(4)} ${currencyInfo?.symbol || selectedCurrency}`;
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
  const errorMessage = hasError ? 'Failed to load some dashboard data. Using local calculations where possible.' : null;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
      
      {/* Currency Conversion Notice */}
      {selectedCurrency !== 'EUR' && getConversionRateDisplay() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="text-xs text-blue-700">
              <span className="font-medium">Currency Conversion:</span> Using current rates - {getConversionRateDisplay()}
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Income"
          value={hideAmounts ? '***' : formatCurrencyAmount(totalIncome)}
          icon={TrendingUp}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        
        <SummaryCard
          title="Total Expenses"
          value={hideAmounts ? '***' : formatCurrencyAmount(totalExpenses)}
          icon={CreditCard}
          bgColor="bg-red-100"
          textColor="text-red-600"
        />
        
        <SummaryCard
          title="Net Savings"
          value={hideAmounts ? '***' : `${netAmount >= 0 ? '+' : ''}${formatCurrencyAmount(Math.abs(netAmount))}`}
          icon={Wallet}
          bgColor={netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'}
          textColor={netAmount >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        
        <SummaryCard
          title="Active Budgets"
          value={Object.keys(budgets).length}
          icon={Target}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LineChartComponent data={monthlyData} hideAmounts={hideAmounts} />
        <PieChartComponent data={categoryData} hideAmounts={hideAmounts} />
      </div>
    </div>
  );
};

export default Dashboard;