import { useCurrency } from '../contexts/CurrencyContext';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency.code}
      onChange={(e) => setCurrency(e.target.value)}
      className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      <option value="EUR">EUR (€)</option>
      <option value="USD">USD ($)</option>
      <option value="XOF">FCFA</option>
    </select>
  );
}