import React, { useState, useEffect } from 'react';
import { TrendingUp, CreditCard, Wallet, Target } from 'lucide-react';
import SummaryCard from '../ui/SummaryCard';
import { LineChartComponent, PieChartComponent } from '../ui/Chart';
import { calculateTotalIncome, calculateTotalExpenses, calculateNetAmount, getExpenseSummary, getCategoryChartData, getMonthlyChartData } from '../../utils/apiCalculations';
import { formatAmount } from '../../utils/formatters';
import { Expense, Budgets } from '../../types';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budgets;
  hideAmounts: boolean;
}

interface SummaryData {
  total_income: number;
  total_expenses: number;
  net_amount: number;
  category_spending: Record<string, number>;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, budgets, hideAmounts }) => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback to local calculations if API data is not available
  const localTotalIncome = calculateTotalIncome(expenses);
  const localTotalExpenses = calculateTotalExpenses(expenses);
  const localNetAmount = calculateNetAmount(expenses);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [summary, categoryChart, monthlyChart] = await Promise.all([
          getExpenseSummary(),
          getCategoryChartData(),
          getMonthlyChartData()
        ]);
        
        setSummaryData(summary);
        setCategoryData(categoryChart);
        setMonthlyData(monthlyChart);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Using local calculations.');
        // Fallback to empty arrays for charts when API fails
        setCategoryData([]);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [expenses]); // Re-fetch when expenses change

  // Use API data if available, otherwise fall back to local calculations
  const totalIncome = summaryData?.total_income ?? localTotalIncome;
  const totalExpenses = summaryData?.total_expenses ?? localTotalExpenses;
  const netAmount = summaryData?.net_amount ?? localNetAmount;

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
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Income"
          value={formatAmount(totalIncome, hideAmounts)}
          icon={TrendingUp}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        
        <SummaryCard
          title="Total Expenses"
          value={formatAmount(totalExpenses, hideAmounts)}
          icon={CreditCard}
          bgColor="bg-red-100"
          textColor="text-red-600"
        />
        
        <SummaryCard
          title="Net Savings"
          value={formatAmount(Math.abs(netAmount), hideAmounts)}
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