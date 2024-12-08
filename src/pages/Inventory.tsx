import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, X } from 'lucide-react';
import { Product, Category } from '../types/types';
import { ProductForm } from '../components/ProductForm';
import { useCurrency } from '../contexts/CurrencyContext';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { fetchProducts, deleteProduct, updateProduct, addProduct } from '../data/products';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchCategories } from '../data/categories';

// Seuil de stock faible
const LOW_STOCK_THRESHOLD = 5;

export function Inventory() {
  const { addNotification } = useNotifications(); // Ensure it's used or remove if unused
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { formatAmount } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const {
    currentItems: currentProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    changeItemsPerPage
  } = usePagination(products);

  useEffect(() => {
    const loadProducts = async () => {
      const productsFromDB = await fetchProducts(selectedCategoryId || undefined);
      setProducts(productsFromDB);
      
      // Vérifier les produits en rupture de stock
      productsFromDB.forEach(product => {
        if (product.stock === 0) {
          addNotification(`${product.name} est en rupture de stock!`, 'error');
        } else if (product.stock <= LOW_STOCK_THRESHOLD) {
          addNotification(`${product.name} est en stock faible (${product.stock} restants)`, 'warning');
        }
      });
    };
    loadProducts();
  }, [selectedCategoryId, addNotification]); // Removed 'notifications' from dependencies
  
  useEffect(() => {
    const loadCategories = async () => {
      const categoriesFromDB = await fetchCategories();
      setCategories(categoriesFromDB);
    };
    loadCategories();
  }, []);

  const handleSubmit = async (productData: Omit<Product, 'id'>) => {
    try {
      console.log('Données à envoyer:', productData);
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, productData);
        console.log('Réponse update:', updated);
        if (updated) {
          addNotification('Produit mis à jour avec succès', 'success');
          setEditingProduct(null);
        } else {
          throw new Error('Échec de la mise à jour');
        }
      } else {
        const added = await addProduct(productData);
        console.log('Réponse add:', added);
        if (added) {
          addNotification('Produit ajouté avec succès', 'success');
        } else {
          throw new Error('Échec de l\'ajout');
        }
      }
      setShowForm(false);
      const productsFromDB = await fetchProducts(selectedCategoryId || undefined);
      setProducts(productsFromDB);
    } catch (error) {
      console.error('Erreur:', error);
      addNotification('Une erreur est survenue', 'error');
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const success = await deleteProduct(productId);
        if (success) {
          addNotification('Produit supprimé avec succès', 'success');
          const updatedProducts = products.filter((p) => p.id !== productId);
          setProducts(updatedProducts);
        }
      } catch (error) {
        addNotification('Erreur lors de la suppression', 'error');
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c: Category) => c.id === categoryId)?.name || 'Catégorie inconnue';
  };

  const getStockStatusStyle = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800 font-bold';
    if (stock <= LOW_STOCK_THRESHOLD) return 'bg-yellow-100 text-yellow-800';
    return 'text-gray-900';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventairesss</h2>
          <select
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau produit
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produit
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                    )}
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getCategoryName(product.categoryId)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatAmount(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusStyle(product.stock)}`}>
                      {product.stock} {product.stock === 0 && <AlertTriangle className="ml-1 h-4 w-4" />}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-1">{product.description || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun produit enregistré</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={changeItemsPerPage}
            itemsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProductForm
              onSubmit={handleSubmit}
              initialProduct={editingProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}