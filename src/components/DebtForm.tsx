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
    customerId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    saleId: '',
    settled: false,
    createdAt: new Date().toISOString(),
    enterpriseId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-gray-500">Chargement du formulaire...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Montant */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant
              </label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-blue-500 focus:ring-blue-500
                         text-sm"
              />
            </div>

            {/* Client ID */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                required
                value={formData.customerId}
                onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-blue-500 focus:ring-blue-500
                         text-sm"
              />
            </div>

            {/* Date d'échéance */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'échéance
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-blue-500 focus:ring-blue-500
                         text-sm"
              />
            </div>

            {/* Enterprise ID */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enterprise ID
              </label>
              <input
                type="text"
                required
                value={formData.enterpriseId}
                onChange={e => setFormData(prev => ({ ...prev, enterpriseId: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm 
                         focus:border-blue-500 focus:ring-blue-500
                         text-sm"
              />
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md 
                       hover:bg-blue-700 focus:outline-none focus:ring-2 
                       focus:ring-blue-500 focus:ring-offset-2
                       text-sm font-medium transition-colors"
            >
              Valider
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}