/**
 * Refactored Expenses Component - Pure UI presentation
 * Separates business logic from presentation using hooks
 */
import React from 'react';

import { DollarSign, Edit2, Plus, Tag, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { useCategoryTranslation, useTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useExpensesData } from '../../hooks/useExpensesData';
import type { Category, Expense } from '../../types';
import { CategoryIcon } from '../../utils/categoryIcons';
import { filterExpenses, getFilterSummary } from '../../utils/expenseFilters';
// UI Components
import ConfirmationModal from '../ui/ConfirmationModal';
import EditExpenseModal from '../ui/EditExpenseModal';

interface ExpensesProps {
  expenses: Expense[];
  categories: Category[];
  hideAmounts: boolean;
}

// Expense Card Component
const ExpenseCard: React.FC<{
  expense: Expense;
  categories: Category[];
  formatAmount: (expense: Expense) => string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}> = ({ expense, categories, formatAmount, onEdit, onDelete }) => {
  const { formatShortDate } = useDateFormatter();
  const { tCategory } = useCategoryTranslation(categories);
  const { t } = useTranslation();

  // Find category details for icon and color
  const getCategoryDetails = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return {
      icon: category?.icon || 'tag',
      color: category?.color || '#6B7280',
      translatedName: tCategory(categoryName),
    };
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const categoryDetails = getCategoryDetails(expense.category);

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow duration-200 p-4">
      {/* Header: Date, Type Icon, and Actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getTypeIcon(expense.type)}
          <span className="text-sm font-medium text-gray-900">
            {formatShortDate(expense.date)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(expense)}
            className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded hover:bg-indigo-50 transition-colors"
            title={t('expenses.editExpense')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="text-red-600 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition-colors"
            title={t('expenses.deleteExpense')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-3">
        {/* Description and Merchant */}
        <div>
          <div className="font-medium text-gray-900 text-base">{expense.description}</div>
          {expense.merchant && (
            <div className="text-sm text-gray-500 mt-1">{expense.merchant}</div>
          )}
        </div>

        {/* Category and Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${categoryDetails.color}20` }}
            >
              <CategoryIcon
                iconName={categoryDetails.icon}
                className="w-4 h-4"
                color={categoryDetails.color}
              />
            </div>
            <span
              className="text-sm font-medium capitalize"
              style={{ color: categoryDetails.color }}
            >
              {categoryDetails.translatedName}
            </span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-semibold ${getTypeColor(expense.type)}`}>
              {formatAmount(expense)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Expense Table Row Component (for larger screens)
const ExpenseTableRow: React.FC<{
  expense: Expense;
  categories: Category[];
  formatAmount: (expense: Expense) => string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}> = ({ expense, categories, formatAmount, onEdit, onDelete }) => {
  const { formatShortDate } = useDateFormatter();
  const { tCategory } = useCategoryTranslation(categories);
  const { t } = useTranslation();

  // Find category details for icon and color
  const getCategoryDetails = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return {
      icon: category?.icon || 'tag',
      color: category?.color || '#6B7280',
      translatedName: tCategory(categoryName),
    };
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const categoryDetails = getCategoryDetails(expense.category);

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {getTypeIcon(expense.type)}
          <span className="ml-2 text-sm font-medium text-gray-900">
            {formatShortDate(expense.date)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{expense.description}</div>
        {expense.merchant && <div className="text-sm text-gray-500">{expense.merchant}</div>}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${categoryDetails.color}20` }}
          >
            <CategoryIcon
              iconName={categoryDetails.icon}
              className="w-4 h-4"
              color={categoryDetails.color}
            />
          </div>
          <span
            className="text-sm font-medium capitalize"
            style={{ color: categoryDetails.color }}
          >
            {categoryDetails.translatedName}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${getTypeColor(expense.type)}`}>
          {formatAmount(expense)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEdit(expense)}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
            title={t('expenses.editExpense')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(expense)}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
            title={t('expenses.deleteExpense')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Summary Stats Component
const ExpensesSummary: React.FC<{
  calculations: {
    totalAmount: number;
    totalIncome: number;
    totalExpenses: number;
    expenseCount: number;
  };
  hideAmounts: boolean;
  currency: string;
}> = ({ calculations, hideAmounts, currency }) => {
  const { t } = useTranslation();
  
  const formatAmount = (amount: number) => {
    if (hideAmounts) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 flex-shrink-0">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600">{t('common.total')}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {formatAmount(calculations.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 flex-shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600">{t('common.income')}</p>
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              {formatAmount(calculations.totalIncome)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 flex-shrink-0">
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600">{t('navigation.expenses')}</p>
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              {formatAmount(calculations.totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 flex-shrink-0">
            <span className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 font-bold text-sm sm:text-base flex items-center justify-center">#</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-gray-600">{t('common.count')}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{calculations.expenseCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => {
  const { t } = useTranslation();
  
  return (
  <div className="text-center py-12">
    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('expenses.noExpenses')}</h3>
    <p className="mt-1 text-sm text-gray-500">{t('expenses.createFirstExpense')}</p>
    <div className="mt-6">
      <button
        onClick={onAddClick}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="w-4 h-4 mr-2" />
        {t('expenses.addExpense')}
      </button>
    </div>
  </div>
  );
};

// Main Expenses Component
const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, hideAmounts }) => {
  const { t } = useTranslation();
  const { filters } = useGlobalFilters();
  
  // Filter expenses based on global filters
  const filteredExpenses = filterExpenses(expenses, filters);
  const filterSummary = getFilterSummary(filters, expenses.length, filteredExpenses.length);
  const {
    modalState,
    calculations,
    handleAddClick,
    handleEditClick,
    handleDeleteClick,
    handleCloseModals,
    handleSaveExpense,
    handleConfirmDelete,
    formatExpenseAmount,
    isCreating,
    isUpdating,
    isDeleting,
  } = useExpensesData(filteredExpenses, categories);

  // Early return for empty state
  if (expenses.length === 0) {
    return <EmptyState onAddClick={handleAddClick} />;
  }
  
  // Show filtered empty state if no results after filtering
  if (filteredExpenses.length === 0 && filterSummary.hasFilters) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Filter Status */}
        <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                No expenses found matching current filters
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Showing 0 of {expenses.length} transactions
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
          <Tag className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No matching expenses</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4 px-4">
            Try adjusting your filters or add a new expense.
          </p>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            {t('expenses.addExpense')}
          </button>
        </div>
      </div>
    );
  }

  // Pure JSX - only UI rendering
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Global Filter Status */}
      {filterSummary.hasFilters && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Showing {filterSummary.filteredCount} of {filterSummary.totalCount} expenses
              </p>
              {filterSummary.description && (
                <p className="text-xs text-blue-600 mt-1">
                  Filtered by: {filterSummary.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('expenses.title')}</h1>
        </div>
        <button
          onClick={handleAddClick}
          disabled={isCreating}
          className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          {isCreating ? t('common.saving') : t('expenses.addExpense')}
        </button>
      </div>

      {/* Summary Stats */}
      <ExpensesSummary
        calculations={calculations}
        hideAmounts={hideAmounts}
        currency="USD" // TODO: Get from user preferences
      />

      {/* Mobile & Tablet: Card Layout */}
      <div className="block lg:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {filteredExpenses.map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              categories={categories}
              formatAmount={formatExpenseAmount}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden lg:block">
        <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.description')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.amount')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map(expense => (
                <ExpenseTableRow
                  key={expense.id}
                  expense={expense}
                  categories={categories}
                  formatAmount={formatExpenseAmount}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {modalState.isEditModalOpen && (
        <EditExpenseModal
          isOpen={modalState.isEditModalOpen}
          onClose={handleCloseModals}
          expense={modalState.editingExpense}
          categories={categories}
          onSave={handleSaveExpense}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {modalState.isConfirmModalOpen && modalState.expenseToDelete && (
        <ConfirmationModal
          isOpen={modalState.isConfirmModalOpen}
          onClose={handleCloseModals}
          onConfirm={handleConfirmDelete}
          title={t('expenses.deleteExpense')}
          message={t('expenses.deleteConfirmMessage', { description: modalState.expenseToDelete.description })}
          confirmButtonText={t('common.delete')}
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Expenses;
