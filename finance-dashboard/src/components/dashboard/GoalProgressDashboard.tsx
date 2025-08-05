import React from 'react';

import { Calendar, Clock, Target, TrendingDown, TrendingUp } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { useUserPreferences } from '../../hooks/useUserPreferences';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  goal_type: 'spending' | 'saving' | 'debt';
  status: 'active' | 'completed' | 'paused';
}

interface GoalProgressDashboardProps {
  goals: Goal[];
  hideAmounts: boolean;
}

const GoalProgressDashboard: React.FC<GoalProgressDashboardProps> = ({ goals, hideAmounts }) => {
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

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressStatus = (progress: number, daysRemaining: number, totalDays: number) => {
    const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100;

    if (progress >= expectedProgress + 10) return 'ahead';
    if (progress < expectedProgress - 10) return 'behind';
    return 'on-track';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead':
        return 'text-green-600 bg-green-100';
      case 'behind':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ahead':
        return t('dashboard.aheadOfSchedule');
      case 'behind':
        return t('dashboard.behindSchedule');
      default:
        return t('dashboard.onTrack');
    }
  };

  const activeGoals = goals.filter(goal => goal.status === 'active').slice(0, 4);

  if (activeGoals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          {t('dashboard.goalProgress')}
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">{t('goals.noActiveGoals')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <Target className="h-5 w-5 mr-2" />
        {t('dashboard.goalProgress')}
      </h3>

      <div className="space-y-4 sm:space-y-6">
        {activeGoals.map(goal => {
          const progress = calculateProgress(goal.current_amount, goal.target_amount);
          const daysRemaining = calculateDaysRemaining(goal.target_date);
          const totalDays = Math.max(365, daysRemaining + 100); // Estimate based on goal creation
          const status = getProgressStatus(progress, daysRemaining, totalDays);

          return (
            <div
              key={goal.id}
              className="border rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                <div className="mb-2 sm:mb-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{goal.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)} mb-1`}
                  >
                    {getStatusText(status)}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {daysRemaining > 0 ? (
                      <span>
                        {daysRemaining} {t('dashboard.daysRemaining')}
                      </span>
                    ) : (
                      <span className="text-red-600">Overdue</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>{formatPercent(progress)} complete</span>
                  <span>{formatAmount(goal.target_amount - goal.current_amount)} remaining</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                  <div
                    className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                      status === 'ahead'
                        ? 'bg-green-500'
                        : status === 'behind'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalProgressDashboard;
