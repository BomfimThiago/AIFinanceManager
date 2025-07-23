import { useState } from 'react';
import { Budgets } from '../types';

const initialBudgets: Budgets = {
  'Groceries': { limit: 400, spent: 89.99 },
  'Utilities': { limit: 200, spent: 45.00 },
  'Entertainment': { limit: 150, spent: 0 },
  'Transport': { limit: 300, spent: 0 },
  'Dining': { limit: 250, spent: 0 }
};

interface UseBudgetsReturn {
  budgets: Budgets;
  addBudget: (category: string, limit: string | number) => void;
  updateBudgetSpent: (category: string, amount: number) => void;
  removeBudget: (category: string) => void;
}

export const useBudgets = (): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<Budgets>(initialBudgets);

  const addBudget = (category: string, limit: string | number): void => {
    setBudgets(prev => ({
      ...prev,
      [category]: { limit: parseFloat(limit.toString()), spent: 0 }
    }));
  };

  const updateBudgetSpent = (category: string, amount: number): void => {
    setBudgets(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        spent: prev[category] ? prev[category].spent + amount : amount
      }
    }));
  };

  const removeBudget = (category: string): void => {
    setBudgets(prev => {
      const newBudgets = { ...prev };
      delete newBudgets[category];
      return newBudgets;
    });
  };

  return {
    budgets,
    addBudget,
    updateBudgetSpent,
    removeBudget
  };
};