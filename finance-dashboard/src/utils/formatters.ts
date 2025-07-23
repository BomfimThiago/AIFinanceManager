export const formatAmount = (amount: number, hideAmounts: boolean = false): string => {
  if (hideAmounts) return '***';
  return `$${amount.toFixed(2)}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};