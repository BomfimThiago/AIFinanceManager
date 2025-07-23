export const formatAmount = (amount, hideAmounts = false) => {
  if (hideAmounts) return '***';
  return `$${amount.toFixed(2)}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};