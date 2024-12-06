import { useState } from 'react';
import { Category } from '../types/types';

interface CategoryFormProps {
  onSubmit: (category: Omit<Category, 'id'>) => void;
  initialCategory: Category | null | undefined;
}

export function CategoryForm({ onSubmit, initialCategory }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialCategory?.name || '',
    color: initialCategory?.color || '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', color: '#3B82F6' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom de la catégorie</label>
        <input
          type="text"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Couleur</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            required
            className="h-10 w-20"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
          <span className="text-sm text-gray-500">{formData.color}</span>
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {initialCategory ? 'Mettre à jour' : 'Ajouter la catégorie'}
      </button>
    </form>
  );
}