import React, { useState, useRef, useEffect } from 'react';
import { Wallet, Eye, EyeOff, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import CurrencySelector from '../ui/CurrencySelector';

interface HeaderProps {
  netAmount: number;
  hideAmounts: boolean;
  onTogglePrivacy: () => void;
}

const Header: React.FC<HeaderProps> = ({ netAmount, hideAmounts, onTogglePrivacy }) => {
  const { user, logout } = useAuth();
  const { formatAmount: formatCurrencyAmount } = useCurrency();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AI Finance Manager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onTogglePrivacy}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title={hideAmounts ? "Show amounts" : "Hide amounts"}
            >
              {hideAmounts ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            
            <CurrencySelector />
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Net Balance</div>
              <div className={`font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hideAmounts ? '****' : formatCurrencyAmount(netAmount)}
              </div>
            </div>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">@{user?.username}</div>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;