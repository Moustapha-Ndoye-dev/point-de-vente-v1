export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // Changed from 'FCFA' to 'XOF'
  }).format(amount);
};