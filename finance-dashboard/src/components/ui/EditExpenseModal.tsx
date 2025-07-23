import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Expense, Category } from '../../types';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>) => void;
  expense: Expense | null;
  categories: Category[];
  isLoading?: boolean;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expense,
  categories,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    category: '',
    description: '',
    merchant: '',
    type: 'expense' as 'expense' | 'income',
    source: 'manual' as 'ai-processed' | 'manual',
    items: [] as string[]
  });

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        merchant: expense.merchant,
        type: expense.type,
        source: expense.source || 'manual',
        items: expense.items || []
      });
    } else {
      // Reset form for create mode
      setFormData({
        date: new Date().toISOString().split('T')[0], // Today's date
        amount: '',
        category: '',
        description: '',
        merchant: '',
        type: 'expense',
        source: 'manual',
        items: []
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.amount || !formData.category || !formData.description) {
      return;
    }

    onSave({
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      merchant: formData.merchant,
      type: formData.type,
      source: formData.source,
      items: formData.items
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter description"
              required
            />
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => handleInputChange('merchant', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter merchant name"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (expense ? 'Save Changes' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal; 