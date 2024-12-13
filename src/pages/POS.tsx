import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, X, DollarSign, CreditCard, UserRound, PackageSearch } from 'lucide-react';
import { Product, Customer, CartItem, PaymentDetails, Category, Sale } from '../types/types';
import { fetchProducts } from '../data/products';
import { fetchCustomers } from '../data/clients';
import { createSale } from '../data/sales';
import { useNotifications } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchCategories } from '../data/categories';
import { Receipt } from '../components/Receipt';
import { useEnterprise } from '../contexts/EnterpriseContext';

function getImageUrl(imageUrl: string | null) {
  if (!imageUrl) return '/placeholder-product.png';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${imageUrl}`;
}

export function POS() {
  const { enterprise, loading } = useEnterprise();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const { formatAmount } = useCurrency();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!enterprise?.id) {
        console.error('Enterprise ID manquant');
        setIsLoading(false);
        return;
      }

      try {
        const [productsData, customersData, categoriesData] = await Promise.all([
          fetchProducts(enterprise.id),
          fetchCustomers(enterprise.id),
          fetchCategories(enterprise.id)
        ]);

        if (productsData) setProducts(productsData);
        if (customersData) setCustomers(customersData);
        if (categoriesData) setCategories(categoriesData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        addNotification('Erreur lors du chargement des données', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      loadData();
    }
  }, [loading, enterprise?.id, addNotification]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!enterprise?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p>Erreur : Session non valide</p>
          <button 
            onClick={() => {/* logique de redirection vers login */}}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(product =>
    (selectedCategory ? product.categoryId === selectedCategory : true) &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      addNotification('Produit en rupture de stock', 'error');
      return;
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          addNotification('Stock insuffisant', 'error');
          return currentCart;
        }
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          if (newQuantity > item.product.stock) {
            addNotification('Stock insuffisant', 'error');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const loadProducts = async () => {
    if (!enterprise?.id) {
      console.error('Enterprise ID is not set');
      return;
    }
    const data = await fetchProducts(enterprise.id);
    setProducts(data);
  };

  const handlePayment = async () => {
    if (paymentMethod === 'debt' && !selectedCustomer) {
      addNotification('Veuillez sélectionner un client pour la dette', 'error');
      return;
    }

    if (paymentAmount < cartTotal && paymentMethod !== 'debt') { 
      addNotification('Le montant payé est insuffisant', 'error');
      return;
    }

    if (!enterprise?.id) {
      addNotification('Erreur: ID entreprise manquant', 'error');
      return;
    }

    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      amount: paymentAmount,
      customer_id: selectedCustomer?.id
    };

    const sale = await createSale(cart, paymentDetails, enterprise.id, dueDate);
    
    if (sale) {
      await loadProducts();
      addNotification('Vente effectuée avec succès', 'success');
      setCompletedSale(sale);
      setCart([]);
      setShowPaymentModal(false);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setPaymentAmount(0);
      setDueDate('');
    } else {
      addNotification('Erreur lors de la vente', 'error');
    }
  };

  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <div 
        className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => addToCart(product)}
      >
        {product.imageUrl ? (
          <img
            src={getImageUrl(product.imageUrl)}
            alt={product.name}
            className="w-full h-32 object-cover rounded-md mb-2"
            onError={(e) => {
              console.error('Erreur de chargement image:', e);
              e.currentTarget.src = '/placeholder-product.png';
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded-md mb-2 flex items-center justify-center">
            <PackageSearch className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-bold text-indigo-600">
            {formatAmount(product.price)}
          </span>
          <span className={`text-xs font-medium ${
            product.stock === 0 ? 'text-red-600' :
            product.stock <= 5 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            Stock: {product.stock}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Section produits */}
      <div className="w-full md:w-2/3 h-full flex flex-col">
        {/* Barre de recherche et filtres */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille de produits avec scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Icône de panier pour mobile */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <button
          onClick={() => setIsCartModalOpen(true)}
          className="relative bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Modal du panier pour mobile */}
      {isCartModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-indigo-700">Panier</h3>
              <button
                onClick={() => setIsCartModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Contenu du panier */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mb-2 text-gray-300" />
                  <p className="text-sm">Votre panier est vide</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center">
                        {item.product.imageUrl ? (
                          <img
                            src={getImageUrl(item.product.imageUrl)}
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <PackageSearch className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatAmount(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 text-gray-500 hover:text-indigo-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Pied du panier avec total et bouton de paiement */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700">Total</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatAmount(cartTotal)}
                </span>
              </div>
              <button
                onClick={() => {
                  setPaymentAmount(cartTotal);
                  setShowPaymentModal(true);
                  setIsCartModalOpen(false); // Fermer le modal du panier
                }}
                disabled={cart.length === 0}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                         disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Procéder au paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panier pour les écrans de bureau */}
      <div className="hidden md:block md:w-1/3 bg-white border-l border-gray-200 flex flex-col md:h-full">
        {/* En-tête du panier */}
        <div className="p-4 bg-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-indigo-700">Panier</h2>
            </div>
            <span className="text-sm font-medium text-gray-600">
              {cart.length} article{cart.length !== 1 ? 's' : ''}
            </span>
          </div>
          {selectedCustomer && (
            <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded-lg">
              <UserRound className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{selectedCustomer.name}</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="ml-auto text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Liste des articles du panier avec scroll */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
              <ShoppingCart className="h-12 w-12 mb-2 text-gray-300" />
              <p className="text-sm">Votre panier est vide</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img
                        src={getImageUrl(item.product.imageUrl)}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <PackageSearch className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatAmount(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 text-gray-500 hover:text-indigo-600"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 text-gray-500 hover:text-indigo-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pied du panier avec total et bouton de paiement */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">Total</span>
            <span className="text-xl font-bold text-indigo-600">
              {formatAmount(cartTotal)}
            </span>
          </div>
          <button
            onClick={() => {
              setPaymentAmount(cartTotal);
              setShowPaymentModal(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Procéder au paiement
          </button>
        </div>
      </div>

      {/* Modals existants */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-indigo-700">Paiement</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${
                      paymentMethod === 'cash'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Espèces
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${
                      paymentMethod === 'card'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    e-money
                  </button>
                  <button
                    onClick={() => { setPaymentMethod('debt'); }}
                    className={`flex items-center justify-center px-4 py-2 border rounded-md ${
                      paymentMethod === 'debt'
                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <UserRound className="h-4 w-4 mr-2" />
                    Dette
                  </button>
                </div>
              </div>

              {paymentMethod === 'debt' && !selectedCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sélectionner un client
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      setSelectedCustomer(customer || null);
                    }}
                  >
                    <option value="">Sélectionner un client</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMethod === 'debt' && selectedCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              )}

              {paymentMethod !== 'debt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant reçu
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">FCFA</span>
                    </div>
                  </div>
                  {paymentAmount >= cartTotal && (
                    <p className="mt-2 text-sm text-gray-500">
                      Monnaie à rendre: {formatAmount(paymentAmount - cartTotal)}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={
                  (paymentMethod === 'debt' && !selectedCustomer) ||
                  (paymentMethod !== 'debt' && paymentAmount < cartTotal) ||
                  (paymentMethod === 'debt' && !dueDate)
                }
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {completedSale && (
        <Receipt
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}