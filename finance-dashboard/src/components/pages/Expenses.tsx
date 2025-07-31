import React, { useMemo, useState } from 'react';

import { DollarSign, Edit2, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

import { useCurrency } from '../../contexts/CurrencyContext';
import { useCategoryTranslation, useTranslation } from '../../contexts/LanguageContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useCreateExpense, useDeleteExpense, useUpdateExpense } from '../../hooks/queries';
import { Category, Expense } from '../../types';
import { getExpenseAmountInCurrency } from '../../utils/currencyHelpers';
import { getUserFriendlyError } from '../../utils/errorMessages';
import { formatDate } from '../../utils/formatters';
import ConfirmationModal from '../ui/ConfirmationModal';
import EditExpenseModal from '../ui/EditExpenseModal';

interface ExpensesProps {
  expenses: Expense[];
  categories: Category[];
  hideAmounts: boolean;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, hideAmounts }) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { t } = useTranslation();
  const { formatAmount: formatCurrencyAmount, convertAmount, sessionCurrency } = useCurrency();
  const { tCategory } = useCategoryTranslation(categories);

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
        showSuccess(t('expenses.expenseDeleted'), t('expenses.expenseDeletedMessage'));
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
            showSuccess(t('expenses.expenseUpdated'), t('expenses.expenseUpdatedMessage'));
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
          showSuccess(t('expenses.expenseCreated'), t('expenses.expenseCreatedMessage'));
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

  // Calculate totals for visible expenses with currency conversion
  const expenseTotals = useMemo(() => {
    const getConvertedAmount = (expense: Expense) => {
      return getExpenseAmountInCurrency(expense, sessionCurrency, convertAmount);
    };

    const totalExpenses = expenses
      .filter(expense => expense.type === 'expense')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    const totalIncome = expenses
      .filter(expense => expense.type === 'income')
      .reduce((sum, expense) => sum + getConvertedAmount(expense), 0);

    const netAmount = totalIncome - totalExpenses;

    return {
      totalExpenses,
      totalIncome,
      netAmount,
      totalTransactions: expenses.length,
    };
  }, [expenses, sessionCurrency, convertAmount]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('expenses.recentTransactions')}</h2>
        <button
          onClick={handleAddClick}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>{t('expenses.addExpense')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('expenses.totalExpenses')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('expenses.totalIncome')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('expenses.netAmount')}</p>
              <p
                className={`text-2xl font-bold ${
                  expenseTotals.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {hideAmounts
                  ? '***'
                  : `${expenseTotals.netAmount >= 0 ? '+' : ''}${formatCurrencyAmount(Math.abs(expenseTotals.netAmount))}`}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                expenseTotals.netAmount >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
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
              <p className="text-sm font-medium text-gray-600">{t('expenses.transactions')}</p>
              <p className="text-2xl font-bold text-gray-900">{expenseTotals.totalTransactions}</p>
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
                  {t('expenses.merchant')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.amount')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('expenses.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map(expense => {
                const CategoryIcon =
                  categories.find(cat => cat.name === expense.category)?.icon || DollarSign;
                const categoryColor =
                  categories.find(cat => cat.name === expense.category)?.color || '#6B7280';

                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <CategoryIcon className="h-4 w-4" style={{ color: categoryColor }} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        {tCategory(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.merchant}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {(() => {
                        if (hideAmounts) return '***';

                        // Get converted amount
                        const convertedAmount = getExpenseAmountInCurrency(
                          expense,
                          sessionCurrency,
                          convertAmount
                        );

                        return `${expense.type === 'income' ? '+' : '-'}${formatCurrencyAmount(convertedAmount)}`;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title={t('expenses.editExpenseTitle')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
                          disabled={deleteExpenseMutation.isPending}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                          title={t('expenses.deleteExpenseTitle')}
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
        isLoading={
          editingExpense ? updateExpenseMutation.isPending : createExpenseMutation.isPending
        }
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t('expenses.confirmDeleteTitle')}
        message={t('expenses.deleteConfirmMessage').replace(
          '{description}',
          expenseToDelete?.description || ''
        )}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={deleteExpenseMutation.isPending}
      />
    </div>
  );
};

export default Expenses;
