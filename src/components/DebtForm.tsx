import { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { Debt } from '../types/types';

interface DebtFormProps {
  onSubmit: (data: Omit<Debt, 'id'>) => void;
}

export function DebtForm({ onSubmit }: DebtFormProps) {
  useCurrency();
  const [formData, setFormData] = useState({
    amount: 0,
    customerId: '', // Changed customer_id to customerId
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Changed due_date to dueDate
    saleId: '', // Changed sale_id to saleId
    settled: false,
    createdAt: new Date().toISOString() // Changed created_at to createdAt
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
        <input
          type="number"
          required
          value={formData.amount}
          onChange={e => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
        <input
          type="text"
          required
          value={formData.customerId} // Changed customer_id to customerId
          onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
        <input
          type="date"
          required
          value={formData.dueDate} // Changed dueDate to due_date
          onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Valider
      </button>
    </form>
  );
}