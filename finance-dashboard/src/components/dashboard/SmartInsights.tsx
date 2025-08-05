import React from 'react';

import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { useUserPreferences } from '../../hooks/useUserPreferences';

interface Expense {
  id: number;
  amount: number;
  category: string;
  date: string;
}

interface SmartInsightsProps {
  expenses: Expense[];
  previousMonthExpenses: Expense[];
  hideAmounts: boolean;
}

interface Insight {
  type: 'achievement' | 'warning' | 'trend' | 'tip';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  amount?: number;
  percentage?: number;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({
  expenses,
  previousMonthExpenses,
  hideAmounts,
}) => {
  const { t } = useTranslation();
  const { currency } = useUserPreferences();

  const formatAmount = (amount: number) => {
    if (hideAmounts) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Calculate current month totals by category
    const currentTotals = expenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate previous month totals by category
    const previousTotals = previousMonthExpenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Compare spending by category
    Object.entries(currentTotals).forEach(([category, currentAmount]) => {
      const previousAmount = previousTotals[category] || 0;

      if (previousAmount > 0) {
        const change = ((currentAmount - previousAmount) / previousAmount) * 100;
        const changeAmount = currentAmount - previousAmount;

        if (Math.abs(change) > 20) {
          // Significant change threshold
          insights.push({
            type: change > 0 ? 'warning' : 'achievement',
            title: `${category} Spending ${change > 0 ? 'Increased' : 'Decreased'}`,
            description: `${t(change > 0 ? 'dashboard.spendingUp' : 'dashboard.spendingDown')} ${Math.abs(change).toFixed(1)}% (${formatAmount(Math.abs(changeAmount))}) ${t('dashboard.compared')}`,
            icon: change > 0 ? TrendingUp : TrendingDown,
            color:
              change > 0
                ? 'text-red-600 bg-red-50 border-red-200'
                : 'text-green-600 bg-green-50 border-green-200',
            amount: Math.abs(changeAmount),
            percentage: Math.abs(change),
          });
        }
      }
    });

    // Find trending categories (consistent growth over time)
    const trendingCategories = Object.entries(currentTotals)
      .filter(([category, amount]) => {
        const previousAmount = previousTotals[category] || 0;
        return amount > previousAmount * 1.1; // 10% growth
      })
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    trendingCategories.forEach(([category, amount]) => {
      insights.push({
        type: 'trend',
        title: `${category} ${t('dashboard.trendingUp')}`,
        description: `This category shows consistent growth. Consider reviewing your spending patterns.`,
        icon: TrendingUp,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        amount,
      });
    });

    // Achievement: Categories with reduced spending
    const improvedCategories = Object.entries(currentTotals)
      .filter(([category, amount]) => {
        const previousAmount = previousTotals[category] || 0;
        return previousAmount > 0 && amount < previousAmount * 0.8; // 20% reduction
      })
      .slice(0, 2);

    improvedCategories.forEach(([category, amount]) => {
      const previousAmount = previousTotals[category];
      const savings = previousAmount - amount;

      insights.push({
        type: 'achievement',
        title: `Great job reducing ${category} spending!`,
        description: `You saved ${formatAmount(savings)} compared to last month.`,
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50 border-green-200',
        amount: savings,
      });
    });

    // Top spending categories
    const topCategories = Object.entries(currentTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topCategories.length > 0) {
      const [topCategory, topAmount] = topCategories[0];
      const totalSpending = Object.values(currentTotals).reduce((a, b) => a + b, 0);
      const percentage = (topAmount / totalSpending) * 100;

      if (percentage > 30) {
        insights.push({
          type: 'warning',
          title: `${topCategory} dominates your spending`,
          description: `This category represents ${percentage.toFixed(1)}% of your total spending (${formatAmount(topAmount)}).`,
          icon: AlertTriangle,
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          amount: topAmount,
          percentage,
        });
      }
    }

    // Spending frequency insights
    const weeklySpending = expenses.reduce(
      (acc, expense) => {
        const week = Math.floor(new Date(expense.date).getDate() / 7);
        acc[week] = (acc[week] || 0) + expense.amount;
        return acc;
      },
      {} as Record<number, number>
    );

    const spendingPattern = Object.values(weeklySpending);
    if (spendingPattern.length >= 2) {
      const isBackLoaded = spendingPattern[spendingPattern.length - 1] > spendingPattern[0] * 1.5;

      if (isBackLoaded) {
        insights.push({
          type: 'tip',
          title: 'End-of-month spending spike detected',
          description:
            'Consider spreading expenses more evenly throughout the month for better cash flow management.',
          icon: Lightbulb,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        });
      }
    }

    // General tips based on data
    if (insights.length < 3) {
      insights.push({
        type: 'tip',
        title: 'Track your progress',
        description:
          'Regular monitoring of your expenses helps identify patterns and opportunities for savings.',
        icon: Target,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      });
    }

    return insights.slice(0, 4); // Limit to 4 insights
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          {t('dashboard.smartInsights')}
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Add more expenses to get personalized insights</p>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'trend':
        return TrendingUp;
      default:
        return Lightbulb;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <Lightbulb className="h-5 w-5 mr-2" />
        {t('dashboard.smartInsights')}
      </h3>

      <div className="space-y-3 sm:space-y-4">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;

          return (
            <div
              key={index}
              className={`border rounded-lg p-3 sm:p-4 ${insight.color} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <IconComponent className="h-5 w-5 mt-0.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base mb-1">{insight.title}</h4>
                  <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                    {insight.description}
                  </p>

                  {(insight.amount || insight.percentage) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {insight.amount && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-50">
                          {formatAmount(insight.amount)}
                        </span>
                      )}
                      {insight.percentage && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white bg-opacity-50">
                          {insight.percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
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

export default SmartInsights;
