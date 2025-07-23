export const calculateTotalIncome = (expenses) => {
  return expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
};

export const calculateTotalExpenses = (expenses) => {
  return expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
};

export const calculateNetAmount = (expenses) => {
  const totalIncome = calculateTotalIncome(expenses);
  const totalExpenses = calculateTotalExpenses(expenses);
  return totalIncome - totalExpenses;
};

export const prepareCategoryData = (expenses, categories) => {
  return categories
    .map(cat => ({
      name: cat.name,
      value: expenses.filter(e => e.category === cat.name && e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
      color: cat.color
    }))
    .filter(cat => cat.value > 0);
};

export const prepareMonthlyData = (expenses) => {
  const totalIncome = calculateTotalIncome(expenses);
  const totalExpenses = calculateTotalExpenses(expenses);
  
  return [
    { month: 'Jun', income: 3200, expenses: 1850 },
    { month: 'Jul', income: totalIncome, expenses: totalExpenses }
  ];
};