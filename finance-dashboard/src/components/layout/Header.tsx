import React, { useEffect, useRef, useState } from 'react';

import { ChevronDown, Eye, EyeOff, LogOut, Settings, User } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useTranslation } from '../../contexts/LanguageContext';
import CurrencySelector from '../ui/CurrencySelector';
import LanguageSelector from '../ui/LanguageSelector';
import Logo from '../ui/Logo';
import PreferencesModal from '../ui/PreferencesModal';

interface HeaderProps {
  hideAmounts: boolean;
  onTogglePrivacy: () => void;
}

const Header: React.FC<HeaderProps> = ({ hideAmounts, onTogglePrivacy }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Logo size="sm" className="sm:size-md" />

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onTogglePrivacy}
              className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title={hideAmounts ? t('header.showAmounts') : t('header.hideAmounts')}
            >
              {hideAmounts ? <Eye className="h-4 w-4 sm:h-5 sm:w-5" /> : <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>

            {/* Currency & Language Selectors - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-4">
              <CurrencySelector />
              <LanguageSelector />
            </div>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="bg-blue-100 p-1 sm:p-1.5 rounded-full">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">@{user?.username}</div>
                </div>
                <ChevronDown
                  className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setIsPreferencesOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('header.preferences')}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('header.signOut')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <PreferencesModal isOpen={isPreferencesOpen} onClose={() => setIsPreferencesOpen(false)} />
    </header>
  );
};

export default Header;
