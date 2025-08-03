/**
 * Refactored Expenses Component - Pure UI presentation
 * Separates business logic from presentation using hooks
 */
import React from 'react';

import { DollarSign, Edit2, Plus, Tag, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useCategoryTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useExpensesData } from '../../hooks/useExpensesData';
import type { Category, Expense } from '../../types';
import { CategoryIcon } from '../../utils/categoryIcons';
// UI Components
import ConfirmationModal from '../ui/ConfirmationModal';
import EditExpenseModal from '../ui/EditExpenseModal';

interface ExpensesProps {
  expenses: Expense[];
  categories: Category[];
  hideAmounts: boolean;
}

// Expense Row Component
const ExpenseRow: React.FC<{
  expense: Expense;
  categories: Category[];
  formatAmount: (expense: Expense) => string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}> = ({ expense, categories, formatAmount, onEdit, onDelete }) => {
  const { formatShortDate } = useDateFormatter();
  const { tCategory } = useCategoryTranslation(categories);

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
        {(() => {
          const categoryDetails = getCategoryDetails(expense.category);
          return (
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
          );
        })()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${getTypeColor(expense.type)}`}>
          {formatAmount(expense)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(expense)}
          className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded hover:bg-indigo-50"
          title="Edit expense"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(expense)}
          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
          title="Delete expense"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
  const formatAmount = (amount: number) => {
    if (hideAmounts) return '••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <h3 className="ml-2 text-sm font-medium text-gray-500">Total</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {formatAmount(calculations.totalAmount)}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="ml-2 text-sm font-medium text-gray-500">Income</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-green-600">
          {formatAmount(calculations.totalIncome)}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <h3 className="ml-2 text-sm font-medium text-gray-500">Expenses</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-red-600">
          {formatAmount(calculations.totalExpenses)}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center">
          <span className="text-gray-400">#</span>
          <h3 className="ml-2 text-sm font-medium text-gray-500">Count</h3>
        </div>
        <p className="mt-2 text-2xl font-semibold text-gray-900">{calculations.expenseCount}</p>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => (
  <div className="text-center py-12">
    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
    <p className="mt-1 text-sm text-gray-500">Get started by creating a new expense.</p>
    <div className="mt-6">
      <button
        onClick={onAddClick}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Expense
      </button>
    </div>
  </div>
);

// Main Expenses Component
const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, hideAmounts }) => {
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
  } = useExpensesData(expenses, categories);

  // Early return for empty state
  if (expenses.length === 0) {
    return <EmptyState onAddClick={handleAddClick} />;
  }

  // Pure JSX - only UI rendering
  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button
          onClick={handleAddClick}
          disabled={isCreating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? 'Adding...' : 'Add Expense'}
        </button>
      </div>

      {/* Summary Stats */}
      <ExpensesSummary
        calculations={calculations}
        hideAmounts={hideAmounts}
        currency="USD" // TODO: Get from user preferences
      />

      {/* Expenses Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map(expense => (
              <ExpenseRow
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
          title="Delete Expense"
          message={`Are you sure you want to delete "${modalState.expenseToDelete.description}"? This action cannot be undone.`}
          confirmButtonText="Delete"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Expenses;
