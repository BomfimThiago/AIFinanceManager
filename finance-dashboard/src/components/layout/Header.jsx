import React from 'react';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { formatAmount } from '../../utils/formatters';

const Header = ({ netAmount, hideAmounts, onTogglePrivacy }) => {
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
            <div className="text-right">
              <div className="text-sm text-gray-500">Net Balance</div>
              <div className={`font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(netAmount, hideAmounts)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;