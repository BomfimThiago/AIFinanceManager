import React, { useState, useCallback, useMemo } from 'react';
import { DollarSign, Edit2, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { Expense, Category } from '../../types';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from '../../hooks/queries';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getUserFriendlyError } from '../../utils/errorMessages';
import EditExpenseModal from '../ui/EditExpenseModal';
import ConfirmationModal from '../ui/ConfirmationModal';

interface ExpensesProps {
  expenses: Expense[];
  categories: Category[];
  hideAmounts: boolean;
  onFiltersChange?: (filters: { month?: number; year?: number; category?: string; type?: string }) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, hideAmounts, onFiltersChange }) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [filters, setFilters] = useState<{ month?: number; year?: number; category?: string; type?: string }>({});
  
  const { formatAmount: formatCurrencyAmount, convertAmount, selectedCurrency } = useCurrency();
  
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const { showSuccess, showError } = useNotificationContext();

  const handleAddClick = () => {
    setEditingExpense(null); // null means create mode
    setIsEditModalOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!expenseToDelete) return;

    deleteExpenseMutation.mutate(expenseToDelete.id, {
      onSuccess: () => {
        showSuccess('Expense Deleted', 'Expense deleted successfully');
        setIsConfirmModalOpen(false);
        setExpenseToDelete(null);
      },
      onError: (error: any) => {
        console.error('Delete expense error:', error);
        const friendlyError = getUserFriendlyError(error);
        showError(friendlyError.title, friendlyError.message);
        setIsConfirmModalOpen(false);
        setExpenseToDelete(null);
      },
    });
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setExpenseToDelete(null);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      // Update existing expense
      updateExpenseMutation.mutate(
        { expenseId: editingExpense.id, expense: expenseData },
        {
          onSuccess: () => {
            showSuccess('Expense Updated', 'Expense updated successfully');
            setIsEditModalOpen(false);
            setEditingExpense(null);
          },
          onError: (error: any) => {
            console.error('Update expense error:', error);
            const friendlyError = getUserFriendlyError(error);
            showError(friendlyError.title, friendlyError.message);
          },
        }
      );
    } else {
      // Create new expense
      createExpenseMutation.mutate(expenseData, {
        onSuccess: () => {
          showSuccess('Expense Created', 'Expense created successfully');
          setIsEditModalOpen(false);
          setEditingExpense(null);
        },
        onError: (error: any) => {
          console.error('Create expense error:', error);
          const friendlyError = getUserFriendlyError(error);
          showError(friendlyError.title, friendlyError.message);
        },
      });
    }
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

  const handleCategoryChange = useCallback((category: string) => {
    const categoryValue = category === 'All Categories' ? undefined : category;
    const newFilters = { ...filters, category: categoryValue };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const handleTypeChange = useCallback((type: string) => {
    const typeValue = type === 'All Types' ? undefined : type;
    const newFilters = { ...filters, type: typeValue };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Category filter
      if (filters.category && expense.category !== filters.category) {
        return false;
      }
      
      // Type filter
      if (filters.type && expense.type !== filters.type) {
        return false;
      }
      
      // Date filters (these are handled by the backend in onFiltersChange)
      // but we can also apply them here for consistency
      if (filters.month || filters.year) {
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getMonth() + 1; // getMonth() returns 0-11
        const expenseYear = expenseDate.getFullYear();
        
        if (filters.month && expenseMonth !== filters.month) {
          return false;
        }
        
        if (filters.year && expenseYear !== filters.year) {
          return false;
        }
      }
      
      return true;
    });
  }, [expenses, filters]);

  // Calculate totals for visible (filtered) expenses with currency conversion
  const expenseTotals = useMemo(() => {
    const getConvertedAmount = (expense: Expense) => {
      // If expense has pre-calculated amounts for the selected currency, use that
      if (expense.amounts && expense.amounts[selectedCurrency]) {
        return expense.amounts[selectedCurrency];
      }
      // Otherwise, convert using current rates
      return convertAmount(expense.amount, expense.original_currency || 'EUR');
    };
    
    const totalExpenses = filteredExpenses
      .filter(expense => expense.type === 'expense')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);
    
    const totalIncome = filteredExpenses
      .filter(expense => expense.type === 'income')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);
    
    const netAmount = totalIncome - totalExpenses;
    
    return {
      totalExpenses,
      totalIncome,
      netAmount,
      totalTransactions: filteredExpenses.length
    };
  }, [filteredExpenses, selectedCurrency, convertAmount]);

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
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAddClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
          <div className="flex space-x-2">
          <select 
            value={filters.type || 'All Types'}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All Types">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <select 
            value={filters.category || 'All Categories'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All Categories">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {hideAmounts ? '***' : formatCurrencyAmount(expenseTotals.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {hideAmounts ? '***' : formatCurrencyAmount(expenseTotals.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Amount</p>
              <p className={`text-2xl font-bold ${
                expenseTotals.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {hideAmounts ? '***' : `${expenseTotals.netAmount >= 0 ? '+' : ''}${formatCurrencyAmount(Math.abs(expenseTotals.netAmount))}`}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              expenseTotals.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {expenseTotals.netAmount >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {expenseTotals.totalTransactions}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
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
              {filteredExpenses.map((expense) => {
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
                      {(() => {
                        if (hideAmounts) return '***';
                        
                        // Get converted amount
                        const convertedAmount = expense.amounts && expense.amounts[selectedCurrency] 
                          ? expense.amounts[selectedCurrency]
                          : convertAmount(expense.amount, expense.original_currency || 'EUR');
                        
                        return `${expense.type === 'income' ? '+' : '-'}${formatCurrencyAmount(convertedAmount)}`;
                      })()} 
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
        isLoading={editingExpense ? updateExpenseMutation.isPending : createExpenseMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expenseToDelete?.description}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};

export default Expenses;