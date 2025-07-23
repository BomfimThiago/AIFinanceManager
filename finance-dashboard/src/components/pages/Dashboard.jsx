import React from 'react';
import { TrendingUp, CreditCard, Wallet, Target } from 'lucide-react';
import SummaryCard from '../ui/SummaryCard';
import { LineChartComponent, PieChartComponent } from '../ui/Chart';
import { calculateTotalIncome, calculateTotalExpenses, calculateNetAmount, prepareCategoryData, prepareMonthlyData } from '../../utils/calculations';
import { formatAmount } from '../../utils/formatters';

const Dashboard = ({ expenses, budgets, categories, hideAmounts }) => {
  const totalIncome = calculateTotalIncome(expenses);
  const totalExpenses = calculateTotalExpenses(expenses);
  const netAmount = calculateNetAmount(expenses);
  const categoryData = prepareCategoryData(expenses, categories);
  const monthlyData = prepareMonthlyData(expenses);

  return (
    <div className="space-y-8">
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