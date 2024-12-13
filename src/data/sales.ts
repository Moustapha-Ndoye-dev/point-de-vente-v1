import { supabase } from '../supabaseClient';
import { Sale, PaymentDetails, CartItem } from '../types/types';

// Créer une nouvelle vente
export const createSale = async (
  cartItems: CartItem[],
  paymentDetails: PaymentDetails,
  enterpriseId: string,
  dueDate?: string
): Promise<Sale | null> => {
  try {
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const remaining = paymentDetails.method === 'debt' ? total : total - paymentDetails.amount;

    // Créer la vente
    const { data: sale, error: saleError } = await supabase
      .from('sale')
      .insert([{
        customer_id: paymentDetails.customer_id,
        total: total,
        paid_amount: paymentDetails.amount,
        remaining_amount: remaining,
        payment_method: paymentDetails.method,
        status: paymentDetails.method === 'debt' ? 'pending' : 'completed',
        created_at: new Date().toISOString(),
        enterprise_id: enterpriseId
      }])
      .select()
      .single();

    if (saleError) throw saleError;

    // Créer les items de la vente
    const saleItems = cartItems.map(item => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.product.price * item.quantity,
      enterprise_id: enterpriseId
    }));

    const { error: itemsError } = await supabase
      .from('sale_item')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    // Mettre à jour le stock des produits
    for (const item of cartItems) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: item.product.stock - item.quantity })
        .eq('id', item.product.id)
        .eq('enterprise_id', enterpriseId);

      if (stockError) throw stockError;
    }

    // Si c'est une dette, créer une entrée dans la table debt
    if (paymentDetails.method === 'debt' && paymentDetails.customer_id) {
      const { error: debtError } = await supabase
        .from('debt')
        .insert([{
          sale_id: sale.id,
          customer_id: paymentDetails.customer_id,
          amount: remaining,
          due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          settled: false,
          enterprise_id: enterpriseId,
          created_at: new Date().toISOString()
        }]);

      if (debtError) throw debtError;
    }

    return await fetchSaleDetails(sale.id, enterpriseId);

  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error);
    return null;
  }
};

// Récupérer les détails d'une vente
export const fetchSaleDetails = async (saleId: string, enterpriseId: string): Promise<Sale | null> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      customer:customer(*),
      items:sale_item(
        *,
        product:products(*)
      )
    `)
    .eq('id', saleId)
    .eq('enterprise_id', enterpriseId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération des détails de la vente:', error);
    return null;
  }

  return data;
};

// Récupérer toutes les ventes
export const fetchAllSales = async (enterpriseId: string): Promise<Sale[]> => {
  if (!enterpriseId) {
    console.error('Enterprise ID est requis');
    return [];
  }

  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      customer:customer(*),
      items:sale_item(
        *,
        product:products(*)
      )
    `)
    .eq('enterprise_id', enterpriseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    return [];
  }

  return data || [];
};

// Annuler une vente
export const cancelSale = async (saleId: string, enterpriseId: string): Promise<boolean> => {
  try {
    const sale = await fetchSaleDetails(saleId, enterpriseId);
    if (!sale) throw new Error('Vente non trouvée');

    // Restaurer le stock des produits
    for (const item of sale.items) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: item.product!.stock + item.quantity })
        .eq('id', item.productId)
        .eq('enterprise_id', enterpriseId);

      if (stockError) throw stockError;
    }

    // Mettre à jour le statut de la vente
    const { error: saleError } = await supabase
      .from('sale')
      .update({ status: 'cancelled' })
      .eq('id', saleId)
      .eq('enterprise_id', enterpriseId);

    if (saleError) throw saleError;

    // Si c'était une dette, la marquer comme réglée
    if (sale.paymentMethod === 'debt') {
      const { error: debtError } = await supabase
        .from('debt')
        .update({ settled: true, settled_at: new Date().toISOString() })
        .eq('sale_id', sale.id)
        .eq('enterprise_id', enterpriseId);

      if (debtError) throw debtError;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la vente:', error);
    return false;
  }
};

// Statistiques
export const fetchTotalDebts = async (enterpriseId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('debt')
    .select('amount')
    .eq('enterprise_id', enterpriseId)
    .eq('settled', false);

  if (error) {
    console.error('Erreur lors de la récupération des dettes totales:', error);
    return 0;
  }

  return data.reduce((sum: number, debt: any) => sum + debt.amount, 0);
};

export const fetchUniqueCustomers = async (enterpriseId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('sale')
    .select('customerId', { count: 'exact', head: true })
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la récupération du nombre de clients uniques:', error);
    return 0;
  }

  return count || 0;
};

export const fetchRecentSales = async (enterpriseId: string): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      customer:customer(*)
    `)
    .eq('enterprise_id', enterpriseId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Erreur lors de la récupération des ventes récentes:', error);
    return [];
  }

  return data;
};

// Ajout de nouvelles fonctions statistiques

// Récupérer le total des ventes par période
export const fetchSalesTotal = async (
  enterpriseId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const { data, error } = await supabase
    .from('sale')
    .select('total')
    .eq('enterprise_id', enterpriseId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) {
    console.error('Erreur lors de la récupération du total des ventes:', error);
    return 0;
  }

  return data.reduce((sum: number, sale: any) => sum + sale.total, 0);
};

// Récupérer les meilleures ventes
export const fetchTopProducts = async (
  enterpriseId: string,
  limit: number = 5
): Promise<any[]> => {
  const { data, error } = await supabase
    .from('sale_item')
    .select(`
      product_id,
      product:products(name),
      total_quantity:quantity(sum),
      total_amount:subtotal(sum)
    `)
    .eq('enterprise_id', enterpriseId)
    .order('total_quantity', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erreur lors de la récupération des meilleures ventes:', error);
    return [];
  }

  return data;
};

// Exemple d'exportation de la fonction fetchSalesHistory
export const fetchSalesHistory = async (enterpriseId: string): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale')
    .select('*')
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la récupération de l\'historique des ventes:', error);
    return [];
  }
  return data || [];
};

// Exemple d'exportation de la fonction fetchDailyItemsSold
export const fetchDailyItemsSold = async (enterpriseId: string): Promise<number> => {
  if (!enterpriseId) {
    console.error('Enterprise ID est requis');
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sale_item')
    .select(`
      quantity,
      sale!inner(created_at, enterprise_id)
    `)
    .eq('sale.enterprise_id', enterpriseId)
    .gte('sale.created_at', today)
    .lte('sale.created_at', today + 'T23:59:59.999Z');

  if (error) {
    console.error('Erreur lors de la récupération des articles vendus aujourd\'hui:', error);
    return 0;
  }

  return data.reduce((total: number, item: any) => total + item.quantity, 0);
};

// Exemple d'exportation de la fonction fetchMonthlyItemsSold
export const fetchMonthlyItemsSold = async (enterpriseId: string): Promise<number> => {
  if (!enterpriseId) {
    console.error('Enterprise ID est requis');
    return 0;
  }

  const firstDayOfMonth = new Date(new Date().setDate(1)).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sale_item')
    .select(`
      quantity,
      sale!inner(created_at, enterprise_id)
    `)
    .eq('sale.enterprise_id', enterpriseId)
    .gte('sale.created_at', firstDayOfMonth);

  if (error) {
    console.error('Erreur lors de la récupération des articles vendus ce mois-ci:', error);
    return 0;
  }

  return data.reduce((total: number, item: any) => total + item.quantity, 0);
};

// Exemple d'exportation de la fonction fetchDailySalesTotal
export const fetchDailySalesTotal = async (enterpriseId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('sale')
    .select('total')
    .eq('enterprise_id', enterpriseId)
    .eq('status', 'completed')
    .gte('created_at', today)
    .lt('created_at', today + 'T23:59:59.999Z');

  if (error) {
    console.error('Erreur lors de la récupération du total des ventes d\'aujourd\'hui:', error);
    return 0;
  }
  return data.reduce((total: number, sale: any) => total + sale.total, 0);
};

// Exemple d'exportation de la fonction fetchMonthlySalesTotal
export const fetchMonthlySalesTotal = async (enterpriseId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('sale')
    .select('total')
    .eq('enterprise_id', enterpriseId)
    .eq('status', 'completed')
    .gte('created_at', new Date(new Date().setDate(1)).toISOString());

  if (error) {
    console.error('Erreur lors de la récupération du total des ventes du mois:', error);
    return 0;
  }
  return data.reduce((total: number, sale: any) => total + sale.total, 0);
};

// Récupérer les détails d'une vente avec calculs
export const getSaleInfo = async (saleId: string, enterpriseId: string): Promise<{
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  saleTotal: number;
} | null> => {
  try {
    const sale = await fetchSaleDetails(saleId, enterpriseId);
    
    if (!sale || !sale.items) {
      console.error('Vente non trouvée ou sans articles');
      return null;
    }

    const products = sale.items.map(item => ({
      name: item.product?.name || 'Produit inconnu',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.subtotal
    }));

    const saleTotal = products.reduce((sum, item) => sum + item.total, 0);

    return {
      products,
      saleTotal
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de la vente:', error);
    return null;
  }
};

export const getPeriodicSaleInfo = async (
  enterpriseId: string,
  timeRange: 'today' | 'week' | 'month' | 'all'
): Promise<{
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  saleTotal: number;
  totalItemsSold: number;
} | null> => {
  try {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setDate(1));
        break;
      default:
        startDate = new Date(0);
    }

    const { data: sales, error } = await supabase
      .from('sale')
      .select(`
        id,
        total,
        created_at,
        items:sale_item(
          quantity,
          unitPrice,
          subtotal,
          product:products(
            name
          )
        )
      `)
      .eq('enterprise_id', enterpriseId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', new Date().toISOString());

    if (error) {
      console.error('Erreur lors de la récupération des ventes:', error);
      return null;
    }

    const productMap = new Map<string, {
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>();

    let totalItemsSold = 0;
    let saleTotal = 0;

    sales.forEach(sale => {
      saleTotal += sale.total;

      sale.items.forEach((item: any) => {
        const productName = item.product?.name || 'Produit inconnu';
        totalItemsSold += item.quantity;
        
        if (productMap.has(productName)) {
          const existing = productMap.get(productName)!;
          existing.quantity += item.quantity;
          existing.total += item.subtotal;
        } else {
          productMap.set(productName, {
            name: productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.subtotal
          });
        }
      });
    });

    const products = Array.from(productMap.values());

    return {
      products,
      saleTotal,
      totalItemsSold
    };

  } catch (error) {
    console.error('Erreur lors de la récupération des informations de vente périodiques:', error);
    return null;
  }
};