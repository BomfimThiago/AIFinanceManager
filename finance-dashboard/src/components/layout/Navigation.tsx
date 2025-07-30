import React from 'react';
import { BarChart3, Upload, CreditCard, Target, Tag, Brain, Link2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import type { TabId } from '../../types';

interface Tab {
  id: TabId;
  nameKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'dashboard', nameKey: 'navigation.dashboard', icon: BarChart3 },
  { id: 'upload', nameKey: 'navigation.upload', icon: Upload },
  { id: 'expenses', nameKey: 'navigation.expenses', icon: CreditCard },
  { id: 'budgets', nameKey: 'navigation.budgets', icon: Target },
  { id: 'categories', nameKey: 'navigation.categories', icon: Tag },
  { id: 'insights', nameKey: 'navigation.insights', icon: Brain },
  { id: 'integrations', nameKey: 'navigation.integrations', icon: Link2 }
];

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{t(tab.nameKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;