import { useState } from 'react';
import { Category } from '../types/types';
import { useNotifications } from '../contexts/NotificationContext';
import { useEnterprise } from '../contexts/EnterpriseContext';

interface CategoryFormProps {
  onSubmit: (category: Omit<Category, 'id'>) => void;
  initialCategory: Category | null | undefined;
  onClose?: () => void;
}

interface FormErrors {
  name: string;
  color: string;
}

export function CategoryForm({ onSubmit, initialCategory, onClose }: CategoryFormProps) {
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({ name: '', color: '' });
  const { enterprise } = useEnterprise();
  
  const [formData, setFormData] = useState({
    name: initialCategory?.name || '',
    color: initialCategory?.color || '#3B82F6',
  });

  // Validation du formulaire
  const validateForm = (): boolean => {
    let tempErrors = { name: '', color: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      tempErrors.name = 'Le nom de la catégorie est requis';
      isValid = false;
    }

    if (!formData.color) {
      tempErrors.color = 'La couleur est requise';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addNotification('Veuillez corriger les erreurs du formulaire', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ ...formData, enterpriseId: enterprise?.id || '' });
      addNotification(
        initialCategory 
          ? 'Catégorie mise à jour avec succès' 
          : 'Catégorie ajoutée avec succès',
        'success'
      );
      setFormData({ name: '', color: '#3B82F6' });
      onClose?.();
    } catch (error) {
      addNotification('Une erreur est survenue', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn border border-gray-200 rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label 
            htmlFor="categoryName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nom de la catégorie
          </label>
          <div className="relative">
            <input
              id="categoryName"
              type="text"
              required
              className={`
                mt-1 block w-full px-4 py-2
                border border-gray-300 rounded-lg shadow-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition duration-150 ease-in-out
                ${errors.name 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                {errors.name}
              </p>
            )}
          </div>
        </div>

        <div>
          <label 
            htmlFor="categoryColor"
            className="block text-sm font-medium text-gray-700"
          >
            Couleur
          </label>
          <div className="mt-1 flex items-center gap-4">
            <div className="relative">
              <input
                id="categoryColor"
                type="color"
                required
                className={`
                  h-10 w-20 rounded-lg border shadow-sm cursor-pointer
                  transition duration-150 ease-in-out
                  ${errors.color 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                  }
                `}
                value={formData.color}
                onChange={(e) => {
                  setFormData({ ...formData, color: e.target.value });
                  if (errors.color) setErrors({ ...errors, color: '' });
                }}
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-600 animate-fadeIn">
                  {errors.color}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full border border-gray-200"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-sm text-gray-500 font-mono">
                {formData.color.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium 
                     text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-150"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium 
            text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150
            disabled:bg-blue-400 disabled:cursor-not-allowed
            flex items-center gap-2
          `}
        >
          {isSubmitting ? (
            <>
            </>
          ) : (
            initialCategory ? 'Mettre à jour' : 'Ajouter la catégorie'
          )}
        </button>
      </div>
    </form>
  );
}