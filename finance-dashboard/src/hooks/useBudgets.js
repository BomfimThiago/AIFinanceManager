import { useState } from 'react';

const initialBudgets = {
  'Groceries': { limit: 400, spent: 89.99 },
  'Utilities': { limit: 200, spent: 45.00 },
  'Entertainment': { limit: 150, spent: 0 },
  'Transport': { limit: 300, spent: 0 },
  'Dining': { limit: 250, spent: 0 }
};

export const useBudgets = () => {
  const [budgets, setBudgets] = useState(initialBudgets);

  const addBudget = (category, limit) => {
    setBudgets(prev => ({
      ...prev,
      [category]: { limit: parseFloat(limit), spent: 0 }
    }));
  };

  const updateBudgetSpent = (category, amount) => {
    setBudgets(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        spent: prev[category] ? prev[category].spent + amount : amount
      }
    }));
  };

  const removeBudget = (category) => {
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