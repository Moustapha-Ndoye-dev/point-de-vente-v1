import { useState } from 'react';
import { Customer } from '../types/types';

interface ClientFormProps {
  onSubmit: (customer: Omit<Customer, 'id'>) => void;
  initialCustomer?: Customer | null;
}

export function ClientForm({ onSubmit, initialCustomer }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: initialCustomer?.name || '',
    phone: initialCustomer?.phone || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      createdAt: new Date().toISOString(), // Changed created_at to createdAt
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom du client
        </label>
        <input
          type="text"
          required
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Téléphone
        </label>
        <input
          type="tel"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialCustomer ? 'Mettre à jour' : 'Ajouter le client'}
        </button>
      </div>
    </form>
  );
}