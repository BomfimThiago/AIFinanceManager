import React from 'react';

import { AlertTriangle, CheckCircle, Clock, PieChart } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { useUserPreferences } from '../../hooks/useUserPreferences';

interface Budget {
  category: string;
  limit: number;
  spent: number;
}

interface BudgetHealthMonitorProps {
  budgets: Record<string, Budget>;
  hideAmounts: boolean;
}

const BudgetHealthMonitor: React.FC<BudgetHealthMonitorProps> = ({ budgets, hideAmounts }) => {
  const { t } = useTranslation();
  const { currency } = useUserPreferences();

  const formatAmount = (amount: number) => {
    if (hideAmounts) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const calculateUsagePercent = (spent: number, limit: number) => {
    return (spent / limit) * 100;
  };

  const getBudgetStatus = (usagePercent: number) => {
    if (usagePercent >= 100) return 'over';
    if (usagePercent >= 80) return 'warning';
    if (usagePercent >= 60) return 'caution';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      case 'caution':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'caution':
        return <Clock className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'over':
        return t('dashboard.overBudget');
      case 'warning':
        return 'Warning';
      case 'caution':
        return 'Caution';
      default:
        return 'Good';
    }
  };

  const budgetEntries = Object.entries(budgets).slice(0, 6); // Show top 6 budgets

  if (budgetEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          {t('dashboard.budgetHealth')}
        </h3>
        <div className="text-center py-8 text-gray-500">
          <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No budgets set up yet</p>
        </div>
      </div>
    );
  }

  // Calculate overall health score
  const overallScore =
    budgetEntries.reduce((acc, [_, budget]) => {
      const usage = calculateUsagePercent(budget.spent, budget.limit);
      const status = getBudgetStatus(usage);
      const score =
        status === 'good' ? 100 : status === 'caution' ? 75 : status === 'warning' ? 50 : 25;
      return acc + score;
    }, 0) / budgetEntries.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0 flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          {t('dashboard.budgetHealth')}
        </h3>

        <div className="flex items-center">
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {Math.round(overallScore)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Overall Health</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {budgetEntries.map(([category, budget]) => {
          const usagePercent = calculateUsagePercent(budget.spent, budget.limit);
          const status = getBudgetStatus(usagePercent);
          const remaining = Math.max(0, budget.limit - budget.spent);

          return (
            <div key={category} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(status)}`} />
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {category}
                  </h4>
                </div>
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    status === 'over'
                      ? 'bg-red-100 text-red-700'
                      : status === 'warning'
                        ? 'bg-orange-100 text-orange-700'
                        : status === 'caution'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                  }`}
                >
                  {getStatusIcon(status)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>
                    {formatAmount(budget.spent)} {t('dashboard.budgetUsed')}
                  </span>
                  <span>{formatPercent(usagePercent)}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(status)}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>

                <div className="text-xs sm:text-sm text-gray-600">
                  {usagePercent >= 100 ? (
                    <span className="text-red-600 font-medium">
                      {formatAmount(budget.spent - budget.limit)} over budget
                    </span>
                  ) : (
                    <span>
                      {formatAmount(remaining)} {t('dashboard.budgetRemaining')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetHealthMonitor;
