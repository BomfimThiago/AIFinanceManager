import React from 'react';

import { Activity, Shield, Target, TrendingUp } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';

interface FinancialHealthScoreProps {
  totalIncome: number;
  totalExpenses: number;
  savingsAmount: number;
  budgetAdherence: number; // 0-100%
  goalProgress: number; // 0-100%
  hideAmounts: boolean;
}

const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  totalIncome,
  totalExpenses,
  savingsAmount,
  budgetAdherence,
  goalProgress,
  hideAmounts,
}) => {
  const { t } = useTranslation();

  // Calculate individual metrics
  const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;

  // Scoring algorithm
  const calculateSavingsRateScore = (rate: number) => {
    if (rate >= 20) return 100;
    if (rate >= 15) return 80;
    if (rate >= 10) return 60;
    if (rate >= 5) return 40;
    return Math.max(0, rate * 8); // Proportional up to 5%
  };

  const calculateExpenseRatioScore = (ratio: number) => {
    if (ratio <= 50) return 100;
    if (ratio <= 70) return 80;
    if (ratio <= 80) return 60;
    if (ratio <= 90) return 40;
    if (ratio <= 100) return 20;
    return 0;
  };

  const savingsRateScore = calculateSavingsRateScore(savingsRate);
  const expenseRatioScore = calculateExpenseRatioScore(expenseRatio);

  // Overall health score (weighted average)
  const overallScore = Math.round(
    savingsRateScore * 0.3 + expenseRatioScore * 0.25 + budgetAdherence * 0.25 + goalProgress * 0.2
  );

  const getHealthLevel = (score: number) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const healthLevel = getHealthLevel(overallScore);

  const metrics = [
    {
      label: t('dashboard.savingsRate'),
      value: hideAmounts ? '••••' : `${Math.round(savingsRate)}%`,
      score: savingsRateScore,
      icon: TrendingUp,
      color: getScoreColor(savingsRateScore),
    },
    {
      label: t('dashboard.budgetAdherence'),
      value: `${Math.round(budgetAdherence)}%`,
      score: budgetAdherence,
      icon: Shield,
      color: getScoreColor(budgetAdherence),
    },
    {
      label: t('dashboard.goalProgressScore'),
      value: `${Math.round(goalProgress)}%`,
      score: goalProgress,
      icon: Target,
      color: getScoreColor(goalProgress),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        {t('dashboard.financialHealth')}
      </h3>

      {/* Overall Score Circle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2.51 * overallScore} 251`}
                className={getScoreColor(overallScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
            </div>
          </div>

          <div className="ml-4">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {t(`dashboard.${healthLevel}`)}
            </div>
            <div className="text-sm text-gray-600">Financial Health</div>
          </div>
        </div>

        <span
          className={`px-3 py-2 rounded-full text-sm font-medium ${getHealthColor(healthLevel)} self-start sm:self-center`}
        >
          {t(`dashboard.${healthLevel}`)}
        </span>
      </div>

      {/* Detailed Metrics */}
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <metric.icon className={`h-5 w-5 mr-3 ${metric.color}`} />
              <div>
                <div className="font-medium text-gray-900 text-sm sm:text-base">{metric.label}</div>
                <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2 mr-3">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metric.score >= 80
                      ? 'bg-green-500'
                      : metric.score >= 60
                        ? 'bg-blue-500'
                        : metric.score >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${metric.score}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${metric.color}`}>
                {Math.round(metric.score)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {savingsRate < 10 && <li>• Try to save at least 10% of your income</li>}
          {budgetAdherence < 70 && <li>• Review your budget categories and spending habits</li>}
          {goalProgress < 50 && (
            <li>• Consider adjusting your financial goals to be more achievable</li>
          )}
          {expenseRatio > 80 && <li>• Look for areas to reduce spending</li>}
        </ul>
      </div>
    </div>
  );
};

export default FinancialHealthScore;
