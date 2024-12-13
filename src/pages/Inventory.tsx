import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, X, PackageSearch } from 'lucide-react';
import { Product, Category } from '../types/types';
import { ProductForm } from '../components/ProductForm';
import { useCurrency } from '../contexts/CurrencyContext';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { fetchProducts, deleteProduct, updateProduct, addProduct } from '../data/products';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchCategories } from '../data/categories';
import { useEnterprise } from '../contexts/EnterpriseContext';

// Seuil de stock faible
const LOW_STOCK_THRESHOLD = 5;

export function Inventory() {
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { formatAmount } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const { enterprise } = useEnterprise();

  const {
    currentItems: currentProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    goToPage,
    changeItemsPerPage
  } = usePagination(products);

  const loadProducts = async () => {
    if (!enterprise?.id) return;
    
    try {
      const productsFromDB = await fetchProducts(enterprise.id);
      setProducts(productsFromDB);

      // Vérifiez les niveaux de stock et déclenchez des notifications
      productsFromDB.forEach(product => {
        if (product.stock <= LOW_STOCK_THRESHOLD) {
          addNotification(`Le stock du produit "${product.name}" est faible.`, 'warning');
        }
      });
    } catch (error) {
      addNotification('Erreur lors du chargement des produits', 'error');
    }
  };

  useEffect(() => {
    if (enterprise?.id) {
      loadProducts();
    }
  }, [enterprise?.id, selectedCategoryId]);

  useEffect(() => {
    const loadCategories = async () => {
      if (enterprise?.id) {
        const categoriesFromDB = await fetchCategories(enterprise.id);
        setCategories(categoriesFromDB);
      }
    };
    loadCategories();
  }, [enterprise?.id]);

  const handleSubmit = async (productData: Omit<Product, 'id'>) => {
    try {
      if (!enterprise?.id) {
        addNotification('Erreur: Entreprise non identifiée', 'error');
        return;
      }

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, productData, enterprise.id);
        if (updated) {
          addNotification('Produit mis à jour avec succès', 'success');
          setEditingProduct(null);
        } else {
          throw new Error('Échec de la mise à jour');
        }
      } else {
        const added = await addProduct({ ...productData, enterpriseId: enterprise.id }, enterprise.id);
        if (added) {
          addNotification('Produit ajouté avec succès', 'success');
        } else {
          throw new Error('Échec de l\'ajout');
        }
      }
      setShowForm(false);
      loadProducts();
    } catch (error) {
      console.error('Erreur:', error);
      addNotification('Une erreur est survenue', 'error');
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        if (!enterprise?.id) {
          addNotification('Erreur: Entreprise non identifiée', 'error');
          return;
        }
        
        const success = await deleteProduct(productId, enterprise.id);
        if (success) {
          addNotification('Produit supprimé avec succès', 'success');
          loadProducts();
        } else {
          throw new Error('Échec de la suppression');
        }
      } catch (error) {
        console.error('Erreur:', error);
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

  // Fonction pour détecter si on est sur mobile
  const isMobile = window.innerWidth <= 768;

  // Rendu mobile de la liste des produits
  const renderMobileProductList = () => {
    return (
      <div className="space-y-4">
        {currentProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {product.imageUrl ? (
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${product.imageUrl}`}
                    alt={product.name}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.png';
                      e.currentTarget.onerror = null;
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <PackageSearch className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getCategoryName(product.categoryId)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-900 p-2"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600 hover:text-red-900 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Prix:</span>
                <span className="ml-2 font-medium">{formatAmount(product.price)}</span>
              </div>
              <div>
                <span className="text-gray-500">Stock:</span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusStyle(product.stock)}`}>
                  {product.stock} {product.stock === 0 && <AlertTriangle className="ml-1 h-4 w-4" />}
                </span>
              </div>
              {product.description && (
                <div className="col-span-2">
                  <span className="text-gray-500">Description:</span>
                  <p className="mt-1 text-gray-700 line-clamp-2">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Rendu desktop de la liste des produits
  const renderDesktopProductList = () => {
    return (
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Produit
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Catégorie
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Prix
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.imageUrl ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${product.imageUrl}`}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover mr-3"
                        onError={(e) => {
                          console.error('Erreur de chargement image:', e);
                          e.currentTarget.src = '/placeholder-product.png';
                          e.currentTarget.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                        <PackageSearch className="h-6 w-6 text-gray-400" />
                      </div>
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
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Inventaire</h2>
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

      <div className="mb-6">
        {isMobile ? renderMobileProductList() : renderDesktopProductList()}
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
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
              categories={categories}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}