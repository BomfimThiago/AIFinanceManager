/**
 * Combined Financial Overview Page - Dashboard and Expenses with tabs
 */
import React, { useState } from 'react';

import { BarChart3, CreditCard } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import type { Budgets, Category, Expense } from '../../types';
import CompactFiltersBarInternal from '../layout/CompactFiltersBarInternal';
import Dashboard from './Dashboard';
import Expenses from './Expenses';

interface FinancialOverviewProps {
  expenses: Expense[];
  budgets: Budgets;
  categories: Category[];
  hideAmounts: boolean;
}

type TabType = 'dashboard' | 'expenses';

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  expenses,
  budgets,
  categories,
  hideAmounts,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tabs = [
    {
      id: 'dashboard' as TabType,
      name: t('navigation.dashboard'),
      icon: BarChart3,
    },
    {
      id: 'expenses' as TabType,
      name: t('navigation.expenses'),
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {t('financialOverview.title', 'Financial Overview')}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('financialOverview.subtitle', 'Monitor your finances and track expenses')}
        </p>
      </div>

      {/* Filters - Above Dashboard/Expenses Tabs */}
      <CompactFiltersBarInternal />

      {/* Tab Navigation */}
      <div className="flex space-x-1 sm:space-x-8 border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 sm:space-x-2 py-2 px-1 sm:px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && (
          <Dashboard expenses={expenses} budgets={budgets} hideAmounts={hideAmounts} />
        )}
        {activeTab === 'expenses' && (
          <Expenses expenses={expenses} categories={categories} hideAmounts={hideAmounts} />
        )}
      </div>
    </div>
  );
};

export default FinancialOverview;
