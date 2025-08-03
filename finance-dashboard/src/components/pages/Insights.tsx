/**
 * Refactored Insights Component - Pure UI presentation
 * Separates business logic from presentation using hooks
 */
import React, { useState } from 'react';

import { Brain, FileText, Lightbulb, TrendingUp } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { useInsightsData } from '../../hooks/useInsightsData';
import type { AIInsight, Expense } from '../../types';
import { FinancialReport } from '../FinancialReport';
import { DateRangePicker } from '../ui/DateRangePicker';

interface InsightsProps {
  aiInsights: AIInsight[];
  onGenerateInsights: () => void;
  expenses: Expense[];
  isGeneratingInsights: boolean;
}

// Empty State Component - Responsive
const EmptyState: React.FC<{
  onGenerate: () => void;
  isGenerating: boolean;
  t: (key: string) => string;
}> = ({ onGenerate, isGenerating, t }) => (
  <div className="bg-white p-6 sm:p-8 lg:p-12 rounded-xl shadow-sm border text-center">
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
      <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
    </div>
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
      {t('insights.aiPoweredAnalysis')}
    </h3>
    <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
      {t('insights.personalizedInsights')}
    </p>
    <button
      onClick={onGenerate}
      disabled={isGenerating}
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mx-auto text-sm sm:text-base"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
          <span>{t('insights.analyzingFinances')}</span>
        </>
      ) : (
        <>
          <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
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
      <span className="text-gray-700 font-medium">{t('insights.generatingFreshInsights')}</span>
    </div>
  </div>
);

// Insight Card Component - Responsive
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
      className={`p-4 sm:p-6 rounded-xl border-l-4 ${styles.bgColor} ${styles.borderColor}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-1.5 sm:p-2 rounded-lg ${styles.iconBgColor} flex-shrink-0`}>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${styles.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{insight.title}</h4>
          <p className="text-gray-700 mb-3 text-sm sm:text-base">{insight.message}</p>
          {insight.actionable && (
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                {t('insights.recommendedAction')}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">{insight.actionable}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Financial Health Score Component - Responsive
const FinancialHealthScore: React.FC<{
  financialHealthScore: {
    score: number;
    statusText: string;
    color: string;
    bgColor: string;
  };
  t: (key: string) => string;
}> = ({ financialHealthScore, t }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
      {t('insights.financialHealthScore')}
    </h3>
    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex-1">
        <div className="flex justify-between text-xs sm:text-sm mb-2">
          <span className="text-gray-500">{t('insights.overallScore')}</span>
          <span className="font-medium text-gray-900">{financialHealthScore.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
          <div
            className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
              financialHealthScore.score >= 80
                ? 'bg-green-500'
                : financialHealthScore.score >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${financialHealthScore.score}%` }}
          ></div>
        </div>
        <p className={`text-xs sm:text-sm font-medium mt-2 ${financialHealthScore.color}`}>
          {financialHealthScore.statusText}
        </p>
      </div>
      <div
        className={`p-2 sm:p-3 rounded-lg ${financialHealthScore.bgColor} self-center sm:self-auto`}
      >
        <TrendingUp className={`h-5 w-5 sm:h-6 sm:w-6 ${financialHealthScore.color}`} />
      </div>
    </div>
  </div>
);

// Tab Component
const TabButton: React.FC<{
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

// Main Insights Component
const Insights: React.FC<InsightsProps> = ({
  aiInsights,
  onGenerateInsights,
  expenses,
  isGeneratingInsights,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'report' | 'insights'>('report');

  // Date range state
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [reportEnabled, setReportEnabled] = useState(false);

  // Create a date-aware insights generator
  const handleGenerateInsightsWithDates = () => {
    // For now, we'll pass date filters to the original function
    // TODO: Update useInsightsData to support date parameters
    onGenerateInsights();
  };

  const {
    financialHealthScore,
    hasInsights,
    isGenerating,
    handleGenerateInsights,
    getInsightIcon,
    getInsightStyles,
  } = useInsightsData(aiInsights, handleGenerateInsightsWithDates, expenses, isGeneratingInsights);

  const handleDateRangeChange = (
    newStartDate: string | undefined,
    newEndDate: string | undefined
  ) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleApplyFilter = () => {
    setReportEnabled(true);
  };

  const handleClearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setReportEnabled(false);
  };

  // Pure JSX - only UI rendering
  return (
    <div className="space-y-6">
      {/* Header - Responsive like Expenses page */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('insights.title')}</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive financial analysis and AI-powered insights
          </p>
        </div>
        {activeTab === 'insights' && (
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center sm:justify-start space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Brain className="h-4 w-4" />
            )}
            <span>{isGenerating ? t('insights.generating') : t('insights.generateInsights')}</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-4">
        <TabButton
          label="Financial Report"
          icon={FileText}
          isActive={activeTab === 'report'}
          onClick={() => setActiveTab('report')}
        />
        <TabButton
          label="AI Insights"
          icon={Lightbulb}
          isActive={activeTab === 'insights'}
          onClick={() => setActiveTab('insights')}
        />
      </div>

      {/* Date Range Picker - Always visible at top */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
        className="mb-6"
      />

      {/* Tab Content */}
      {activeTab === 'report' ? (
        reportEnabled ? (
          <FinancialReport startDate={startDate} endDate={endDate} enabled={reportEnabled} />
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Date Range for Financial Report
            </h3>
            <p className="text-gray-600">
              Choose a date range above and click "Apply Filter" to generate your comprehensive
              financial report.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* AI Insights Content */}
          {!hasInsights ? (
            <EmptyState onGenerate={handleGenerateInsights} isGenerating={isGenerating} t={t} />
          ) : (
            <div className="space-y-4">
              {/* Loading overlay when generating new insights */}
              {isGenerating && <LoadingState t={t} />}

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
          <FinancialHealthScore financialHealthScore={financialHealthScore} t={t} />
        </div>
      )}
    </div>
  );
};

export default Insights;
