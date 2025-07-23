import { useState, useEffect } from 'react';
import { Budgets } from '../types';
import { budgetApi } from '../services/apiService';

interface UseBudgetsReturn {
  budgets: Budgets;
  addBudget: (category: string, limit: string | number) => Promise<void>;
  updateBudgetSpent: (category: string, amount: number) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refreshBudgets: () => Promise<void>;
}

export const useBudgets = (): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<Budgets>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBudgets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedBudgets = await budgetApi.getAll();
      setBudgets(fetchedBudgets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBudgets();
  }, []);

  const addBudget = async (category: string, limit: string | number): Promise<void> => {
    try {
      setError(null);
      const budget = await budgetApi.create({ 
        category, 
        limit: parseFloat(limit.toString()) 
      });
      setBudgets(prev => ({
        ...prev,
        [category]: budget
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add budget');
      console.error('Error adding budget:', err);
      throw err;
    }
  };

  const updateBudgetSpent = async (category: string, amount: number): Promise<void> => {
    try {
      setError(null);
      const updatedBudget = await budgetApi.updateSpent(category, amount);
      setBudgets(prev => ({
        ...prev,
        [category]: updatedBudget
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
      console.error('Error updating budget:', err);
      throw err;
    }
  };

  const removeBudget = async (category: string): Promise<void> => {
    try {
      setError(null);
      await budgetApi.delete(category);
      setBudgets(prev => {
        const newBudgets = { ...prev };
        delete newBudgets[category];
        return newBudgets;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove budget');
      console.error('Error removing budget:', err);
      throw err;
    }
  };

  return {
    budgets,
    addBudget,
    updateBudgetSpent,
    removeBudget,
    loading,
    error,
    refreshBudgets
  };
};