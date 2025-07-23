import { expenseApi } from '../services/apiService';
import { Expense } from '../types';

// Client-side calculations (for immediate UI updates)
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

// API-based calculations (for accurate server-side data)
export async function getExpenseSummary() {
  try {
    return await expenseApi.getSummary();
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    return {
      total_income: 0,
      total_expenses: 0,
      net_amount: 0,
      category_spending: {}
    };
  }
}

export async function getCategoryChartData() {
  try {
    return await expenseApi.getCategoriesChart();
  } catch (error) {
    console.error('Error fetching category chart data:', error);
    return [];
  }
}

export async function getMonthlyChartData() {
  try {
    return await expenseApi.getMonthlyChart();
  } catch (error) {
    console.error('Error fetching monthly chart data:', error);
    return [];
  }
}