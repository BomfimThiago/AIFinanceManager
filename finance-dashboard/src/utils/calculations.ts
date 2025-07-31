import { Category, Expense } from '../types';

export const calculateTotalIncome = (expenses: Expense[]): number => {
  return expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
};

export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
};

export const calculateNetAmount = (expenses: Expense[]): number => {
  const totalIncome = calculateTotalIncome(expenses);
  const totalExpenses = calculateTotalExpenses(expenses);
  return totalIncome - totalExpenses;
};

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export const prepareCategoryData = (
  expenses: Expense[],
  categories: Category[]
): CategoryData[] => {
  return categories
    .map(cat => ({
      name: cat.name,
      value: expenses
        .filter(e => e.category === cat.name && e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0),
      color: cat.color,
    }))
    .filter(cat => cat.value > 0);
};

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export const prepareMonthlyData = (expenses: Expense[]): MonthlyData[] => {
  const totalIncome = calculateTotalIncome(expenses);
  const totalExpenses = calculateTotalExpenses(expenses);

  return [
    { month: 'Jun', income: 3200, expenses: 1850 },
    { month: 'Jul', income: totalIncome, expenses: totalExpenses },
  ];
};
