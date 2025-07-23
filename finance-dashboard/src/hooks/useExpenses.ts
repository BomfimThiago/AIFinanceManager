import { useState, useEffect } from 'react';
import { Expense } from '../types';
import { expenseApi } from '../services/apiService';

interface UseExpensesReturn {
  expenses: Expense[];
  addExpense: (expense: Expense) => Promise<void>;
  removeExpense: (id: number) => Promise<void>;
  updateExpense: (id: number, updatedExpense: Partial<Expense>) => void;
  loading: boolean;
  error: string | null;
  refreshExpenses: () => Promise<void>;
}

export const useExpenses = (): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshExpenses = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedExpenses = await expenseApi.getAll();
      setExpenses(fetchedExpenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshExpenses();
  }, []);

  const addExpense = async (expenseData: Omit<Expense, 'id'> | Omit<Expense, 'id'>[]): Promise<void> => {
    try {
      setError(null);
      if (Array.isArray(expenseData)) {
        // Handle bulk creation
        const newExpenses = await expenseApi.createBulk(expenseData);
        setExpenses(prev => [...newExpenses, ...prev]);
      } else {
        // Handle single expense creation
        const newExpense = await expenseApi.create(expenseData);
        setExpenses(prev => [newExpense, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense(s)');
      console.error('Error adding expense(s):', err);
      throw err;
    }
  };

  const removeExpense = async (id: number): Promise<void> => {
    try {
      setError(null);
      await expenseApi.delete(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove expense');
      console.error('Error removing expense:', err);
      throw err;
    }
  };

  const updateExpense = (id: number, updatedExpense: Partial<Expense>): void => {
    setExpenses(prev => 
      prev.map(expense => expense.id === id ? { ...expense, ...updatedExpense } : expense)
    );
  };

  return {
    expenses,
    addExpense,
    removeExpense,
    updateExpense,
    loading,
    error,
    refreshExpenses
  };
};