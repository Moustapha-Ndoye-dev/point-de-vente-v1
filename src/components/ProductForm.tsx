import { useState } from 'react';
import { Product, Category } from '../types/types';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { uploadProductImage } from '../utils/storage';
import { PackageSearch } from 'lucide-react';

interface ProductFormProps {
  onSubmit: (data: Omit<Product, 'id'>) => Promise<void>;
  initialProduct?: Product | null;
  categories: Category[];
  onClose?: () => void;
}

export function ProductForm({ onSubmit, initialProduct, categories }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    price: initialProduct?.price?.toString() || '',
    stock: initialProduct?.stock?.toString() || '',
    description: initialProduct?.description || '',
    categoryId: initialProduct?.categoryId || '',
    imageUrl: initialProduct?.imageUrl || ''
  });

  const { enterprise } = useEnterprise();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }
    
    onSubmit({
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      enterpriseId: enterprise?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = await uploadProductImage(file);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du produit</label>
            <input
              type="text"
              required
              className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prix</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
            <input
              type="number"
              required
              min="0"
              className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
            <select
              required
              className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={handleImageChange}
              />
              {formData.imageUrl ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${formData.imageUrl}`}
                  alt="Aperçu"
                  className="h-12 w-12 object-cover rounded-lg ml-4"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.png';
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-200 ml-4 flex items-center justify-center">
                  <PackageSearch className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                     transition-colors duration-200"
          >
            {initialProduct ? 'Mettre à jour' : 'Ajouter le produit'}
          </button>
        </div>
      </div>
    </form>
  );
}