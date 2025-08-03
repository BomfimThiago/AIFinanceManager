/**
 * Comprehensive Financial Report Component
 * Displays detailed financial analytics and insights
 */
import React from 'react';

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle,
  DollarSign,
  Minus,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { useCurrency } from '../contexts/CurrencyContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useFinancialReport } from '../hooks/queries/useFinancialReportQuery';

// Loading Component - Responsive
const ReportLoading: React.FC = () => (
  <div className="space-y-4 sm:space-y-6">
    {/* Header skeleton */}
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <div className="animate-pulse space-y-3 sm:space-y-4">
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 sm:h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>

    {/* Content skeletons */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/3 sm:w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 sm:h-4 bg-gray-100 rounded"></div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded w-5/6"></div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Error Component - Responsive
const ReportError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border text-center">
    <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Failed to Load Financial Report</h3>
    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
      {error.message || 'An error occurred while generating your financial report.'}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
    >
      Try Again
    </button>
  </div>
);

// Metric Card Component - Responsive
const MetricCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
}> = ({ title, value, change, trend, icon: Icon, color }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 sm:p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        {change && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span
              className={`text-xs sm:text-sm font-medium ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {change}
            </span>
          </div>
        )}
      </div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-xs sm:text-sm text-gray-600">{title}</p>
    </div>
  );
};

// Category Analysis Component - Responsive
const CategoryAnalysis: React.FC<{ categories: any[] }> = ({ categories }) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
        Category Breakdown
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {categories.slice(0, 8).map((category, index) => (
          <div key={category.category} className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: `hsl(${(index * 360) / categories.length}, 70%, 50%)`,
                }}
              />
              <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{category.category}</span>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <div className="font-semibold text-gray-900 text-sm sm:text-base">{formatAmount(category.amount)}</div>
              <div className="text-xs sm:text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Budget Performance Component - Responsive
const BudgetPerformance: React.FC<{ budget: any }> = ({ budget }) => {
  const { formatAmount } = useCurrency();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
        Budget Performance
      </h3>

      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between text-xs sm:text-sm mb-2">
          <span className="text-gray-600">Overall Adherence</span>
          <span className="font-medium">{budget.overall_adherence_score.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
          <div
            className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
              budget.overall_adherence_score >= 80
                ? 'bg-green-500'
                : budget.overall_adherence_score >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, budget.overall_adherence_score)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2 text-sm sm:text-base">Under Budget</h4>
          <div className="space-y-1">
            {budget.categories_under_budget.slice(0, 3).map((category: string) => (
              <div key={category} className="text-xs sm:text-sm text-green-700 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2 text-sm sm:text-base">Over Budget</h4>
          <div className="space-y-1">
            {budget.categories_over_budget.slice(0, 3).map((category: string) => (
              <div key={category} className="text-xs sm:text-sm text-red-700 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{category}</span>
              </div>
            ))}
            {budget.categories_over_budget.length === 0 && (
              <div className="text-xs sm:text-sm text-gray-500">All within budget!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Recommendations Component - Responsive
const Recommendations: React.FC<{ recommendations: any[] }> = ({ recommendations }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
        AI Recommendations
      </h3>

      <div className="space-y-3 sm:space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">{rec.title}</h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(rec.priority)} self-start sm:self-auto`}
              >
                {rec.priority}
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">{rec.description}</p>
            <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs text-gray-500">
              <span>Impact: {rec.impact}</span>
              <span>Timeframe: {rec.timeframe}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Financial Report Component
export const FinancialReport: React.FC<{
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}> = ({ startDate, endDate, enabled = false }) => {
  const { data: report, isLoading, error } = useFinancialReport(startDate, endDate, enabled);
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();

  if (isLoading) return <ReportLoading />;
  if (error) return <ReportError error={error as Error} />;
  if (!report) return null;

  const {
    executive_summary,
    category_analysis,
    budget_performance,
    financial_health,
    recommendations,
    action_plan,
  } = report;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Executive Summary */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Financial Report</h2>
          <div className="text-xs sm:text-sm text-gray-500">
            {executive_summary.period_start} to {executive_summary.period_end}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <MetricCard
            title="Total Income"
            value={formatAmount(executive_summary.total_income)}
            icon={TrendingUp}
            color="bg-green-600"
          />
          <MetricCard
            title="Total Expenses"
            value={formatAmount(executive_summary.total_expenses)}
            icon={TrendingDown}
            color="bg-red-600"
          />
          <MetricCard
            title="Net Savings"
            value={formatAmount(executive_summary.net_savings)}
            change={`${executive_summary.net_savings_percentage.toFixed(1)}%`}
            trend={executive_summary.net_savings > 0 ? 'up' : 'down'}
            icon={DollarSign}
            color="bg-blue-600"
          />
          <MetricCard
            title="Health Score"
            value={`${executive_summary.financial_health_score}/100`}
            icon={BarChart3}
            color="bg-purple-600"
          />
        </div>

        {/* Quick Insights */}
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Key Insights</h3>
          <ul className="space-y-1 sm:space-y-2">
            {executive_summary.quick_insights.map((insight: string, index: number) => (
              <li key={index} className="text-xs sm:text-sm text-gray-700 flex items-start">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 sm:mt-2 mr-2 flex-shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Category Analysis and Budget Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CategoryAnalysis categories={category_analysis} />
        <BudgetPerformance budget={budget_performance} />
      </div>

      {/* Financial Health Score */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
          Financial Health Analysis
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
              {financial_health.savings_rate.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Savings Rate</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
              {financial_health.emergency_fund_months.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Emergency Fund (Months)</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1 capitalize">
              {financial_health.overall_grade}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Overall Grade</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Recommendations recommendations={recommendations} />
      )}

      {/* Action Plan */}
      {action_plan && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Your Action Plan
          </h3>

          <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-green-50 rounded-lg">
            <div className="text-base sm:text-lg font-semibold text-green-800 mb-1">
              Potential Monthly Savings: {formatAmount(action_plan.monthly_savings_potential)}
            </div>
            <div className="text-xs sm:text-sm text-green-700">If you follow these recommendations</div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Next Steps:</h4>
            <ul className="space-y-2 sm:space-y-3">
              {action_plan.next_steps.map((step: string, index: number) => (
                <li key={index} className="text-xs sm:text-sm text-gray-700 flex items-start">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-2 sm:mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
