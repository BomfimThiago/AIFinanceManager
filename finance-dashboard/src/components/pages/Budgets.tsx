import React, { useState } from 'react';
import { Plus, X, Target, AlertCircle } from 'lucide-react';
import { formatAmount } from '../../utils/formatters';
import { Budgets as BudgetsType, Category } from '../../types';

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
  const [showBudgetForm, setShowBudgetForm] = useState<boolean>(false);
  const [newBudget, setNewBudget] = useState<NewBudgetState>({ category: '', limit: '' });

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(budgets).map(([category, budget]) => {
          const percentage = (budget.spent / budget.limit) * 100;
          const CategoryIcon = categories.find(cat => cat.name === category)?.icon || Target;
          const categoryColor = categories.find(cat => cat.name === category)?.color || '#6B7280';
          const isOverBudget = budget.spent > budget.limit;
          
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
                    {formatAmount(budget.spent, hideAmounts)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium text-gray-900">{formatAmount(budget.limit, hideAmounts)}</span>
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
                    budget.limit - budget.spent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatAmount(Math.abs(budget.limit - budget.spent), hideAmounts)} {budget.limit - budget.spent >= 0 ? 'left' : 'over'}
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