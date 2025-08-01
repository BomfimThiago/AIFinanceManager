/**
 * Expenses Service - Business logic for expense management
 * Handles bulk operations and business rules
 */

import { getUserFriendlyError } from '../utils/errorMessages';

export interface ExpenseOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class ExpensesService {
  constructor(
    private createBulkExpensesMutation: any,
    private showNotification: (type: 'success' | 'error', title: string, message: string) => void
  ) {}

  async addExpenses(expenses: any[]): Promise<ExpenseOperationResult> {
    try {
      await this.createBulkExpensesMutation.mutateAsync(expenses);
      const count = expenses.length;
      this.showNotification(
        'success',
        'Expenses Added',
        `${count} expense${count > 1 ? 's' : ''} added successfully`
      );
      return { 
        success: true, 
        message: `${count} expense${count > 1 ? 's' : ''} added successfully` 
      };
    } catch (error: any) {
      console.error('Add expenses error:', error);
      const friendlyError = getUserFriendlyError(error);
      this.showNotification('error', friendlyError.title, friendlyError.message);
      return { success: false, error: friendlyError.message };
    }
  }

  validateExpenseData(expenses: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(expenses) || expenses.length === 0) {
      errors.push('No expenses provided');
      return { valid: false, errors };
    }

    expenses.forEach((expense, index) => {
      if (!expense.amount || isNaN(parseFloat(expense.amount))) {
        errors.push(`Expense ${index + 1}: Invalid amount`);
      }
      if (!expense.description || expense.description.trim().length === 0) {
        errors.push(`Expense ${index + 1}: Description is required`);
      }
      if (!expense.category || expense.category.trim().length === 0) {
        errors.push(`Expense ${index + 1}: Category is required`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  processExpenseData(rawExpenses: any[]) {
    return rawExpenses.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount),
      date: expense.date || new Date().toISOString().split('T')[0],
      type: expense.type || 'expense',
    }));
  }
}