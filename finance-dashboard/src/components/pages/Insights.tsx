import React from 'react';

import { AlertCircle, Brain, TrendingUp } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { AIInsight, Expense } from '../../types';
import { calculateNetAmount } from '../../utils/calculations';

interface InsightsProps {
  aiInsights: AIInsight[];
  onGenerateInsights: () => void;
  expenses: Expense[];
  isGeneratingInsights: boolean;
}

const Insights: React.FC<InsightsProps> = ({
  aiInsights,
  onGenerateInsights,
  expenses,
  isGeneratingInsights,
}) => {
  const { t } = useTranslation();
  const netAmount = calculateNetAmount(expenses);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('insights.title')}</h2>
        <button
          onClick={onGenerateInsights}
          disabled={isGeneratingInsights}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingInsights ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span>
            {isGeneratingInsights ? t('insights.generating') : t('insights.generateInsights')}
          </span>
        </button>
      </div>

      {aiInsights.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('insights.aiPoweredAnalysis')}
          </h3>
          <p className="text-gray-600 mb-4">{t('insights.personalizedInsights')}</p>
          <button
            onClick={onGenerateInsights}
            disabled={isGeneratingInsights}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingInsights ? (
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
      ) : (
        <div className="space-y-4">
          {/* Loading overlay when generating new insights */}
          {isGeneratingInsights && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-gray-700 font-medium">
                  {t('insights.generatingFreshInsights')}
                </span>
              </div>
            </div>
          )}

          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border-l-4 ${
                insight.type === 'warning'
                  ? 'bg-red-50 border-red-500'
                  : insight.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    insight.type === 'warning'
                      ? 'bg-red-100'
                      : insight.type === 'success'
                        ? 'bg-green-100'
                        : 'bg-blue-100'
                  }`}
                >
                  {insight.type === 'warning' ? (
                    <AlertCircle className={`h-5 w-5 text-red-600`} />
                  ) : insight.type === 'success' ? (
                    <TrendingUp className={`h-5 w-5 text-green-600`} />
                  ) : (
                    <Brain className={`h-5 w-5 text-blue-600`} />
                  )}
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
          ))}
        </div>
      )}

      {/* Financial Health Score */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('insights.financialHealthScore')}
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">{t('insights.overallScore')}</span>
              <span className="font-medium text-gray-900">
                {netAmount >= 0 ? '85/100' : '65/100'} -{' '}
                {netAmount >= 0 ? t('insights.good') : t('insights.needsAttention')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${netAmount >= 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${netAmount >= 0 ? '85' : '65'}%` }}
              ></div>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${netAmount >= 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <TrendingUp
              className={`h-6 w-6 ${netAmount >= 0 ? 'text-green-600' : 'text-yellow-600'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
