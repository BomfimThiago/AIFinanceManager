import React, { useState } from 'react';
import { Plus, X, Target, AlertCircle } from 'lucide-react';
import { Budgets as BudgetsType, Category } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useCategorySpending } from '../../hooks/queries';

interface BudgetsProps {
  budgets: BudgetsType;
  categories: Category[];
  onAddBudget: (category: string, limit: string | number) => void;
  hideAmounts: boolean;
}

interface NewBudgetState {
  category: string;
  limit: string;
}

const Budgets: React.FC<BudgetsProps> = ({ budgets, categories, onAddBudget, hideAmounts }) => {
  const { formatAmount: formatCurrencyAmount, convertAmount, selectedCurrency, exchangeRates, currencies } = useCurrency();
  const [showBudgetForm, setShowBudgetForm] = useState<boolean>(false);
  const [newBudget, setNewBudget] = useState<NewBudgetState>({ category: '', limit: '' });
  
  // Get category spending from backend with currency conversion
  const { data: categorySpendingData } = useCategorySpending({ currency: selectedCurrency });
  const categorySpending = categorySpendingData?.category_spending || {};

  // Helper function to get actual spending for a category
  const getActualSpending = (category: string) => {
    return categorySpending[category] || 0;
  };

  // Helper function to convert budget amounts (assuming they're stored in EUR)
  const convertBudgetAmount = (amount: number) => {
    // Budget amounts are stored in EUR (base currency), convert to selected currency
    return convertAmount(amount, 'EUR');
  };

  // Get conversion rates for display
  const getConversionRateDisplay = () => {
    if (selectedCurrency === 'EUR') return null; // No conversion needed for base currency
    
    const rate = exchangeRates[selectedCurrency];
    if (!rate) return null;
    
    const currencyInfo = currencies[selectedCurrency];
    return `1 EUR = ${rate.toFixed(4)} ${currencyInfo?.symbol || selectedCurrency}`;
  };

  const handleAddBudget = (): void => {
    if (newBudget.category && newBudget.limit) {
      onAddBudget(newBudget.category, newBudget.limit);
      setNewBudget({ category: '', limit: '' });
      setShowBudgetForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Budget Overview</h2>
        <button
          onClick={() => setShowBudgetForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Budget</span>
        </button>
      </div>

      {showBudgetForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Budget</h3>
            <button
              onClick={() => setShowBudgetForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={newBudget.category}
              onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select Category</option>
              {categories.filter(cat => cat.name !== 'Income').map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Budget Limit"
              value={newBudget.limit}
              onChange={(e) => setNewBudget(prev => ({ ...prev, limit: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
            <button
              onClick={handleAddBudget}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Budget
            </button>
          </div>
        </div>
      )}

      {/* Currency Conversion Notice */}
      {selectedCurrency !== 'EUR' && getConversionRateDisplay() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <div className="text-xs text-blue-700">
              <span className="font-medium">Currency Conversion:</span> Using current rates - {getConversionRateDisplay()}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(budgets).map(([category, budget]) => {
          // Get actual spending from backend (already in selected currency)
          const actualSpent = getActualSpending(category);
          const convertedLimit = convertBudgetAmount(budget.limit);
          const percentage = (actualSpent / convertedLimit) * 100;
          const CategoryIcon = categories.find(cat => cat.name === category)?.icon || Target;
          const categoryColor = categories.find(cat => cat.name === category)?.color || '#6B7280';
          const isOverBudget = actualSpent > convertedLimit;
          
          return (
            <div key={category} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryColor}20` }}>
                    <CategoryIcon className="h-5 w-5" style={{ color: categoryColor }} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                </div>
                {isOverBudget && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Spent</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {hideAmounts ? '***' : formatCurrencyAmount(actualSpent)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium text-gray-900">{hideAmounts ? '***' : formatCurrencyAmount(convertedLimit)}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {percentage.toFixed(1)}% used
                  </span>
                  <span className={`font-medium ${
                    convertedLimit - actualSpent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {hideAmounts ? '***' : formatCurrencyAmount(Math.abs(convertedLimit - actualSpent))} {convertedLimit - actualSpent >= 0 ? 'left' : 'over'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Budgets;