import React, { useState } from 'react';

import { BarChart3, Brain, CreditCard, Link2, Menu, Tag, Target, Upload, X } from 'lucide-react';

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
  { id: 'goals', nameKey: 'navigation.goals', icon: Target },
  { id: 'categories', nameKey: 'navigation.categories', icon: Tag },
  { id: 'insights', nameKey: 'navigation.insights', icon: Brain },
  { id: 'integrations', nameKey: 'navigation.integrations', icon: Link2 },
];

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId: TabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  return (
    <nav className="bg-white border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop: Horizontal tabs (hidden on small screens) */}
        <div className="hidden sm:flex overflow-x-auto scrollbar-hide space-x-6 lg:space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap shrink-0 ${
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

        {/* Mobile: Burger menu */}
        <div className="sm:hidden flex items-center justify-between py-3">
          {/* Active tab indicator */}
          <div className="flex items-center space-x-2">
            {(() => {
              const activeTabData = tabs.find(tab => tab.id === activeTab);
              return activeTabData ? (
                <>
                  <activeTabData.icon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-600">{t(activeTabData.nameKey)}</span>
                </>
              ) : null;
            })()}
          </div>

          {/* Burger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50">
            <div className="px-4 py-2 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{t(tab.nameKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
