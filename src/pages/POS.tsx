import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, X, DollarSign, CreditCard, UserRound } from 'lucide-react';
import { Product, Customer, CartItem, PaymentDetails, Category, Sale } from '../types/types';
import { fetchProducts } from '../data/products';
import { fetchCustomers } from '../data/clients';
import { createSale } from '../data/sales';
import { useNotifications } from '../contexts/NotificationContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { fetchCategories } from '../data/categories';
import { Receipt } from '../components/Receipt';

export function POS() {
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

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
  };

  const loadCustomers = async () => {
    const data = await fetchCustomers();
    setCustomers(data);
  };

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

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

  const handlePayment = async () => {
    if (paymentMethod === 'debt' && !selectedCustomer) {
      addNotification('Veuillez sélectionner un client pour la dette', 'error');
      return;
    }

    if (paymentAmount < cartTotal && paymentMethod !== 'debt') { 
      addNotification('Le montant payé est insuffisant', 'error');
      return;
    }

    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      amount: paymentAmount,
      customer_id: selectedCustomer?.id
    };

    const sale = await createSale(cart, paymentDetails, dueDate);
    
    if (sale) {
      addNotification('Vente effectuée avec succès', 'success');
      setCompletedSale(sale); // Set the completed sale
      setCart([]);
      setShowPaymentModal(false);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setPaymentAmount(0);
      setDueDate('');
      loadProducts(); // Recharger les produits pour mettre à jour les stocks
    } else {
      addNotification('Erreur lors de la vente', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-indigo-500 to-purple-600">
      {/* Liste des produits */}
      <div className="flex-1 p-6 overflow-auto bg-white shadow-lg rounded-l-lg">
        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-48">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
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
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-2 hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105"
              onClick={() => addToCart(product)}
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
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
          ))}
        </div>
      </div>

      {/* Panier */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg rounded-r-lg">
        <div className="p-6 border-b border-gray-200 bg-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-indigo-700">Panier</h2>
            <ShoppingCart className="h-6 w-6 text-indigo-600" />
          </div>
          {selectedCustomer && (
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <UserRound className="h-5 w-5" />
              <span>{selectedCustomer.name}</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="h-12 w-12 mb-4" />
              <p>Aucun produit dans le panier</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">{formatAmount(item.product.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-red-400 hover:text-red-500 focus:outline-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-indigo-50">
          <div className="flex justify-between mb-4">
            <span className="text-lg font-semibold text-indigo-700">Total</span>
            <span className="text-lg font-bold text-indigo-600">{formatAmount(cartTotal)}</span>
          </div>
          <button
            onClick={() => {
              setPaymentAmount(cartTotal);
              setShowPaymentModal(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Procéder au paiement
          </button>
        </div>
      </div>

      {/* Modal de paiement */}
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
                    Carte
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

      {/* Modal de ticket de caisse */}
      {completedSale && (
        <Receipt
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}