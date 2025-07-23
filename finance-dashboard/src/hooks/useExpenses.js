import { useState } from 'react';

const initialExpenses = [
  {
    id: 1,
    date: '2025-07-20',
    amount: 89.99,
    category: 'Groceries',
    description: 'Weekly grocery shopping',
    merchant: 'Whole Foods',
    type: 'expense'
  },
  {
    id: 2,
    date: '2025-07-19',
    amount: 45.00,
    category: 'Utilities',
    description: 'Electricity bill',
    merchant: 'Power Company',
    type: 'expense'
  },
  {
    id: 3,
    date: '2025-07-18',
    amount: 3200.00,
    category: 'Income',
    description: 'Salary deposit',
    merchant: 'Employer',
    type: 'income'
  }
];

export const useExpenses = () => {
  const [expenses, setExpenses] = useState(initialExpenses);

  const addExpense = (expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const removeExpense = (id) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const updateExpense = (id, updatedExpense) => {
    setExpenses(prev => 
      prev.map(expense => expense.id === id ? { ...expense, ...updatedExpense } : expense)
    );
  };

  return {
    expenses,
    addExpense,
    removeExpense,
    updateExpense
  };
};