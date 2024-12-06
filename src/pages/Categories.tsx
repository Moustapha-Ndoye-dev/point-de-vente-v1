import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Category } from '../types/types';
import { CategoryForm } from '../components/CategoryForm';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { fetchCategories, deleteCategory, updateCategory, addCategory } from '../data/categories';
import { useNotifications } from '../contexts/NotificationContext';

export function Categories() {
  const { addNotification } = useNotifications();

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    currentItems: currentCategories,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    changeItemsPerPage
  } = usePagination(categories, 10); // Default items per page

  useEffect(() => {
    const loadCategories = async () => {
      const categoriesFromDB = await fetchCategories();
      setCategories(categoriesFromDB);
    };
    loadCategories();
  }, []); // Charger les catégories au démarrage

  const handleSubmit = async (categoryData: Omit<Category, 'id'>) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData.name, categoryData.color);
        addNotification('Catégorie mise à jour avec succès', 'success');
        setEditingCategory(null);
      } else {
        await addCategory(categoryData.name, categoryData.color);
        addNotification('Catégorie ajoutée avec succès', 'success');
      }
      setShowForm(false);
      const categoriesFromDB = await fetchCategories();
      setCategories(categoriesFromDB);
    } catch (error) {
      addNotification('Une erreur est survenue', 'error');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        const success = await deleteCategory(categoryId);
        if (success) {
          const updatedCategories = categories.filter((c) => c.id !== categoryId);
          setCategories(updatedCategories);
          addNotification('Catégorie supprimée avec succès', 'success');
        }
      } catch (error) {
        addNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Catégories</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CategoryForm
              onSubmit={handleSubmit}
              initialCategory={editingCategory}
            />
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Couleur
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentCategories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowForm(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-500"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune catégorie trouvée</p>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={changeItemsPerPage}
          itemsPerPageOptions={[5, 10, 20]}
        />
      )}
    </div>
  );
}