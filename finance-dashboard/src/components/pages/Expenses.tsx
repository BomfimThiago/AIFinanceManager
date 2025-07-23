import React, { useState, useCallback } from 'react';
import { DollarSign, Edit2, Trash2 } from 'lucide-react';
import { formatAmount, formatDate } from '../../utils/formatters';
import { Expense, Category } from '../../types';
import { useUpdateExpense, useDeleteExpense } from '../../hooks/queries';
import { useToast } from '../../contexts/ToastContext';
import EditExpenseModal from '../ui/EditExpenseModal';

interface ExpensesProps {
  expenses: Expense[];
  categories: Category[];
  hideAmounts: boolean;
  onFiltersChange?: (filters: { month?: number; year?: number }) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, hideAmounts, onFiltersChange }) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ month?: number; year?: number }>({});
  
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const { showToast } = useToast();

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    if (window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      deleteExpenseMutation.mutate(expense.id, {
        onSuccess: () => {
          showToast('success', 'Expense deleted successfully');
        },
        onError: (error: any) => {
          showToast('error', error?.message || 'Failed to delete expense');
        },
      });
    }
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (!editingExpense) return;

    updateExpenseMutation.mutate(
      { expenseId: editingExpense.id, expense: expenseData },
      {
        onSuccess: () => {
          showToast('success', 'Expense updated successfully');
          setIsEditModalOpen(false);
          setEditingExpense(null);
        },
        onError: (error: any) => {
          showToast('error', error?.message || 'Failed to update expense');
        },
      }
    );
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingExpense(null);
  };

  const handleMonthChange = useCallback((month: string) => {
    const monthValue = month ? parseInt(month) : undefined;
    const newFilters = { ...filters, month: monthValue };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const handleYearChange = useCallback((year: string) => {
    const yearValue = year ? parseInt(year) : undefined;
    const newFilters = { ...filters, year: yearValue };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
        <div className="flex space-x-2">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>All Categories</option>
            {categories.map(cat => (
              <option key={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select 
            value={filters.year || ''} 
            onChange={(e) => handleYearChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Years</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select 
            value={filters.month || ''} 
            onChange={(e) => handleMonthChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Months</option>
            {monthOptions.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => {
                const CategoryIcon = categories.find(cat => cat.name === expense.category)?.icon || DollarSign;
                const categoryColor = categories.find(cat => cat.name === expense.category)?.color || '#6B7280';
                
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${categoryColor}20` }}>
                          <CategoryIcon className="h-4 w-4" style={{ color: categoryColor }} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{expense.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.merchant}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {expense.type === 'income' ? '+' : '-'}{formatAmount(expense.amount, hideAmounts)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit expense"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
                          disabled={deleteExpenseMutation.isPending}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                          title="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
        categories={categories}
        isLoading={updateExpenseMutation.isPending}
      />
    </div>
  );
};

export default Expenses;