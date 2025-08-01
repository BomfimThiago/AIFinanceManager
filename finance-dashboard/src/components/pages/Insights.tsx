/**
 * Refactored Insights Component - Pure UI presentation
 * Separates business logic from presentation using hooks
 */

import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';

import { useInsightsData } from '../../hooks/useInsightsData';
import { useTranslation } from '../../contexts/LanguageContext';
import type { AIInsight, Expense } from '../../types';

interface InsightsProps {
  aiInsights: AIInsight[];
  onGenerateInsights: () => void;
  expenses: Expense[];
  isGeneratingInsights: boolean;
}

// Empty State Component
const EmptyState: React.FC<{ 
  onGenerate: () => void; 
  isGenerating: boolean;
  t: (key: string) => string;
}> = ({ onGenerate, isGenerating, t }) => (
  <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
      <Brain className="h-8 w-8 text-white" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {t('insights.aiPoweredAnalysis')}
    </h3>
    <p className="text-gray-600 mb-4">{t('insights.personalizedInsights')}</p>
    <button
      onClick={onGenerate}
      disabled={isGenerating}
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>{t('insights.analyzingFinances')}</span>
        </>
      ) : (
        <>
          <Brain className="h-5 w-5" />
          <span>{t('insights.analyzeMyFinances')}</span>
        </>
      )}
    </button>
  </div>
);

// Loading State Component
const LoadingState: React.FC<{ t: (key: string) => string }> = ({ t }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border">
    <div className="flex items-center justify-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      <span className="text-gray-700 font-medium">
        {t('insights.generatingFreshInsights')}
      </span>
    </div>
  </div>
);

// Insight Card Component
const InsightCard: React.FC<{
  insight: AIInsight;
  index: number;
  getInsightIcon: (type: string) => any;
  getInsightStyles: (type: string) => any;
  t: (key: string) => string;
}> = ({ insight, index, getInsightIcon, getInsightStyles, t }) => {
  const Icon = getInsightIcon(insight.type);
  const styles = getInsightStyles(insight.type);

  return (
    <div
      key={index}
      className={`p-6 rounded-xl border-l-4 ${styles.bgColor} ${styles.borderColor}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${styles.iconBgColor}`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
          <p className="text-gray-700 mb-3">{insight.message}</p>
          {insight.actionable && (
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {t('insights.recommendedAction')}
              </p>
              <p className="text-sm text-gray-700">{insight.actionable}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Financial Health Score Component
const FinancialHealthScore: React.FC<{
  financialHealthScore: {
    score: number;
    statusText: string;
    color: string;
    bgColor: string;
  };
  t: (key: string) => string;
}> = ({ financialHealthScore, t }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      {t('insights.financialHealthScore')}
    </h3>
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">{t('insights.overallScore')}</span>
          <span className="font-medium text-gray-900">
            {financialHealthScore.score}/100 - {financialHealthScore.statusText}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              financialHealthScore.score >= 80 
                ? 'bg-green-500' 
                : financialHealthScore.score >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${financialHealthScore.score}%` }}
          ></div>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${financialHealthScore.bgColor}`}>
        <TrendingUp className={`h-6 w-6 ${financialHealthScore.color}`} />
      </div>
    </div>
  </div>
);

// Main Insights Component
const Insights: React.FC<InsightsProps> = ({
  aiInsights,
  onGenerateInsights,
  expenses,
  isGeneratingInsights,
}) => {
  const { t } = useTranslation();
  
  const {
    financialHealthScore,
    hasInsights,
    isGenerating,
    handleGenerateInsights,
    getInsightIcon,
    getInsightStyles,
  } = useInsightsData(aiInsights, onGenerateInsights, expenses, isGeneratingInsights);

  // Pure JSX - only UI rendering
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('insights.title')}</h2>
        <button
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span>
            {isGenerating ? t('insights.generating') : t('insights.generateInsights')}
          </span>
        </button>
      </div>

      {/* Content */}
      {!hasInsights ? (
        <EmptyState 
          onGenerate={handleGenerateInsights} 
          isGenerating={isGenerating}
          t={t}
        />
      ) : (
        <div className="space-y-4">
          {/* Loading overlay when generating new insights */}
          {isGenerating && (
            <LoadingState t={t} />
          )}

          {/* Insights List */}
          {aiInsights.map((insight, index) => (
            <InsightCard
              key={index}
              insight={insight}
              index={index}
              getInsightIcon={getInsightIcon}
              getInsightStyles={getInsightStyles}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Financial Health Score */}
      <FinancialHealthScore 
        financialHealthScore={financialHealthScore}
        t={t}
      />
    </div>
  );
};

export default Insights;