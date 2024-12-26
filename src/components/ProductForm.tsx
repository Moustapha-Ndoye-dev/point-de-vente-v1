import { useState } from 'react';
import { Product, Category } from '../types/types';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { uploadProductImage } from '../utils/storage';
import { PackageSearch, X } from 'lucide-react';

interface ProductFormProps {
  onSubmit: (data: Omit<Product, 'id'>) => Promise<void>;
  initialProduct?: Product | null;
  categories: Category[];
  onClose?: () => void;
}

export function ProductForm({ onSubmit, initialProduct, categories, onClose }: ProductFormProps) {
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
    
    await onSubmit({
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      enterpriseId: enterprise?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (onClose) {
      onClose();
    }
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
    <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image du produit
          </label>
          <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {formData.imageUrl ? (
              <div className="relative w-32 h-32 mb-4">
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${formData.imageUrl}`}
                  alt="Aperçu"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.png';
                    e.currentTarget.onerror = null;
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 mb-4 flex items-center justify-center bg-gray-100 rounded-lg">
                <PackageSearch className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 
                       file:px-4 file:rounded-full file:border-0 file:text-sm 
                       file:font-semibold file:bg-blue-50 file:text-blue-700 
                       hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ resize: 'none' }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}