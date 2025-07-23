import React from 'react';
import { BarChart3, Upload, CreditCard, Target, Brain } from 'lucide-react';
import type { TabId } from '../../types';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'upload', name: 'Upload', icon: Upload },
  { id: 'expenses', name: 'Expenses', icon: CreditCard },
  { id: 'budgets', name: 'Budgets', icon: Target },
  { id: 'insights', name: 'AI Insights', icon: Brain }
];

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
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
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;