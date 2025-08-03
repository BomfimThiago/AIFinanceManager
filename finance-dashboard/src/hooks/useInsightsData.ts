/**
 * Insights Data Hook - Business logic for AI insights management
 * Handles insight generation, financial health calculations
 */
import { useCallback, useMemo, useState } from 'react';

import { AlertCircle, Brain, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

import { useTranslation } from '../contexts/LanguageContext';
import type { AIInsight, Expense } from '../types';
import { calculateNetAmount } from '../utils/calculations';
import { getUserFriendlyError } from '../utils/errorMessages';
import { useAppNotifications } from './useAppNotifications';
import { useUserPreferences } from './useUserPreferences';

interface FinancialHealthScore {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'needs-attention';
  statusText: string;
  color: string;
  bgColor: string;
}

interface InsightsDataResult {
  // Core data
  netAmount: number;
  financialHealthScore: FinancialHealthScore;
  hasInsights: boolean;

  // UI state
  isGenerating: boolean;

  // Actions
  handleGenerateInsights: () => Promise<void>;

  // Utilities
  getInsightIcon: (type: string) => any;
  getInsightStyles: (type: string) => {
    bgColor: string;
    borderColor: string;
    iconBgColor: string;
    iconColor: string;
  };
  formatInsightType: (type: string) => string;
}

export function useInsightsData(
  aiInsights: AIInsight[],
  onGenerateInsights: () => void,
  expenses: Expense[],
  isGeneratingInsights: boolean
): InsightsDataResult {
  const {} = useUserPreferences();
  const { showSuccess, showError } = useAppNotifications();
  const { t } = useTranslation();

  // Local state for additional UI management
  const [isGenerating, setIsGenerating] = useState(false);

  // Financial calculations
  const netAmount = useMemo(() => calculateNetAmount(expenses), [expenses]);

  // Financial health score calculation
  const financialHealthScore = useMemo<FinancialHealthScore>(() => {
    const totalIncome = expenses
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = expenses
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    let score: number;
    let status: FinancialHealthScore['status'];
    let statusText: string;
    let color: string;
    let bgColor: string;

    if (savingsRate >= 20) {
      score = Math.min(95, 80 + savingsRate);
      status = 'excellent';
      statusText = t('insights.excellent');
      color = 'text-green-600';
      bgColor = 'bg-green-100';
    } else if (savingsRate >= 10) {
      score = Math.min(85, 70 + savingsRate);
      status = 'good';
      statusText = t('insights.good');
      color = 'text-green-600';
      bgColor = 'bg-green-100';
    } else if (savingsRate >= 0) {
      score = Math.min(75, 50 + savingsRate);
      status = 'fair';
      statusText = t('insights.fair');
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-100';
    } else {
      score = Math.max(30, 50 + savingsRate);
      status = 'needs-attention';
      statusText = t('insights.needsAttention');
      color = 'text-red-600';
      bgColor = 'bg-red-100';
    }

    return {
      score: Math.round(score),
      status,
      statusText,
      color,
      bgColor,
    };
  }, [expenses, t]);

  // Generate insights handler
  const handleGenerateInsights = useCallback(async () => {
    setIsGenerating(true);
    try {
      await onGenerateInsights();
      showSuccess(t('insights.insightsGenerated'), t('insights.insightsGeneratedMessage'));
    } catch (error: any) {
      console.error('Generate insights error:', error);
      const friendlyError = getUserFriendlyError(error);
      showError(friendlyError.title, friendlyError.message);
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerateInsights, showSuccess, showError, t]);

  // Utility functions
  const getInsightIcon = useCallback((type: string) => {
    switch (type) {
      case 'warning':
        return AlertCircle;
      case 'success':
        return TrendingUp;
      case 'info':
        return Brain;
      case 'spending':
        return DollarSign;
      case 'saving':
        return TrendingUp;
      case 'debt':
        return TrendingDown;
      default:
        return Brain;
    }
  }, []);

  const getInsightStyles = useCallback((type: string) => {
    switch (type) {
      case 'warning':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          iconBgColor: 'bg-red-100',
          iconColor: 'text-red-600',
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          iconBgColor: 'bg-green-100',
          iconColor: 'text-green-600',
        };
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-500',
          iconBgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
        };
    }
  }, []);

  const formatInsightType = useCallback(
    (type: string) => {
      switch (type) {
        case 'warning':
          return t('common.warning');
        case 'success':
          return t('common.success');
        case 'info':
          return t('insights.analysis');
        case 'spending':
          return t('insights.spendingPatterns');
        case 'saving':
          return t('categories.savings');
        case 'debt':
          return t('categories.bills');
        default:
          return t('insights.analysis');
      }
    },
    [t]
  );

  const hasInsights = aiInsights.length > 0;
  const isGeneratingState = isGeneratingInsights || isGenerating;

  return {
    // Core data
    netAmount,
    financialHealthScore,
    hasInsights,

    // UI state
    isGenerating: isGeneratingState,

    // Actions
    handleGenerateInsights,

    // Utilities
    getInsightIcon,
    getInsightStyles,
    formatInsightType,
  };
}
