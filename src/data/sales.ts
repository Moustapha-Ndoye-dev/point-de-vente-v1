import { supabase } from '../supabaseClient';
import { Sale, PaymentDetails, CartItem } from '../types/types';

// Créer une nouvelle vente
export const createSale = async (
  cartItems: CartItem[],
  paymentDetails: PaymentDetails,
  dueDate?: string
): Promise<Sale | null> => {
  try {
    console.log('Creating sale with cartItems:', cartItems);
    console.log('Payment details:', paymentDetails);
    console.log('Due date:', dueDate);

    // Calculer le total
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const remaining = paymentDetails.method === 'debt' ? total : total - paymentDetails.amount;

    console.log('Total:', total);
    console.log('Remaining:', remaining);

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
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (saleError) throw saleError;

    console.log('Sale created:', sale);

    // Créer les items de la vente
    const saleItems = cartItems.map(item => ({
      sale_id: sale.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      subtotal: item.product.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('sale_item')
      .insert(saleItems);

    if (itemsError) throw itemsError;

    console.log('Sale items created:', saleItems);

    // Mettre à jour le stock des produits
    for (const item of cartItems) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: item.product.stock - item.quantity })
        .eq('id', item.product.id);

      if (stockError) throw stockError;

      console.log(`Stock updated for product ${item.product.id}: ${item.product.stock - item.quantity}`);
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
          settled: false
        }]);

      if (debtError) throw debtError;

      console.log('Debt created for sale:', sale.id);
    }

    // **Ajouté: Récupérer les détails complets de la vente incluant les produits**
    const detailedSale = await fetchSaleDetails(sale.id);
    return detailedSale;

  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error);
    return null;
  }
};

// Récupérer les détails d'une vente
export const fetchSaleDetails = async (saleId: string): Promise<Sale | null> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      items:sale_item(
        *,
        product:products(*)
      ),
      customer:customer(*)
    `)
    .eq('id', saleId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération des détails de la vente:', error);
    return null;
  }

  console.log('Fetched sale details:', data);
  return data;
};

// Récupérer l'historique des ventes
export const fetchSalesHistory = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      items:sale_item(
        *,
        product:products(*)
      ),
      customer:customer(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération de l\'historique des ventes:', error);
    return [];
  }

  console.log('Fetched sales history:', data);
  return data;
};

// Récupérer le total des ventes du jour
export const fetchDailySalesTotal = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('sale')
    .select('total')
    .gte('created_at', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('Erreur lors de la récupération du total des ventes du jour:', error);
    return 0;
  }

  console.log('Fetched daily sales total:', data);
  return data.reduce((sum, sale) => sum + sale.total, 0);
};

// Récupérer le total des ventes du mois
export const fetchMonthlySalesTotal = async (): Promise<number> => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data, error } = await supabase
    .from('sale')
    .select('total')
    .gte('created_at', startOfMonth);

  if (error) {
    console.error('Erreur lors de la récupération du total des ventes du mois:', error);
    return 0;
  }

  console.log('Fetched monthly sales total:', data);
  return data.reduce((sum, sale) => sum + sale.total, 0);
};

// Récupérer le nombre d'articles vendus du jour
export const fetchDailyItemsSold = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('sale_item')
    .select('quantity')
    .gte('created_at', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('Erreur lors de la récupération du nombre d\'articles vendus du jour:', error);
    return 0;
  }

  console.log('Fetched daily items sold:', data);
  return data.reduce((sum, item) => sum + item.quantity, 0);
};

// Récupérer le nombre d'articles vendus du mois
export const fetchMonthlyItemsSold = async (): Promise<number> => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data, error } = await supabase
    .from('sale_item')
    .select('quantity')
    .gte('created_at', startOfMonth);

  if (error) {
    console.error('Erreur lors de la récupération du nombre d\'articles vendus du mois:', error);
    return 0;
  }

  console.log('Fetched monthly items sold:', data);
  return data.reduce((sum, item) => sum + item.quantity, 0);
};

// Récupérer toutes les ventes du jour
export const fetchTodaysSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      items:sale_item(
        *,
        product:products(*)
      ),
      customer:customer(*)
    `)
    .gte('created_at', new Date().toISOString().split('T')[0]);

  if (error) {
    console.error('Erreur lors de la récupération des ventes du jour:', error);
    return [];
  }

  console.log('Fetched today\'s sales:', data);
  return data;
};

// Récupérer toutes les ventes du mois
export const fetchMonthsSales = async (): Promise<Sale[]> => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      items:sale_item(
        *,
        product:products(*)
      ),
      customer:customer(*)
    `)
    .gte('created_at', startOfMonth);

  if (error) {
    console.error('Erreur lors de la récupération des ventes du mois:', error);
    return [];
  }

  console.log('Fetched month\'s sales:', data);
  return data;
};

// Récupérer toutes les ventes
export const fetchAllSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      items:sale_item(
        *,
        product:products(*)
      ),
      customer:customer(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération de toutes les ventes:', error);
    return [];
  }

  console.log('Fetched all sales:', data);
  return data;
};

// Annuler une vente
export const cancelSale = async (saleId: string): Promise<boolean> => {
  try {
    // Récupérer les détails de la vente
    const sale = await fetchSaleDetails(saleId);
    if (!sale) throw new Error('Vente non trouvée');

    // Restaurer le stock des produits
    for (const item of sale.items) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: item.product!.stock + item.quantity })
        .eq('id', item.product_id);

      if (stockError) throw stockError;
    }

    // Mettre à jour le statut de la vente
    const { error: saleError } = await supabase
      .from('sale')
      .update({ status: 'cancelled' })
      .eq('id', saleId);

    if (saleError) throw saleError;

    // Si c'était une dette, la marquer comme réglée
    if (sale.payment_method === 'debt') {
      const { error: debtError } = await supabase
        .from('debt')
        .update({ settled: true, settled_at: new Date().toISOString() })
        .eq('sale_id', sale.id);

      if (debtError) throw debtError;
    }

    console.log('Sale cancelled:', saleId);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la vente:', error);
    return false;
  }
};

// Exemple de nouvelles fonctions si elles n'existent pas déjà
export const fetchTotalDebts = async (): Promise<number> => {
  const { data, error } = await supabase
    .from('debt')
    .select('amount', { count: 'exact', head: false });

  if (error) {
    console.error('Erreur lors de la récupération des dettes totales:', error);
    return 0;
  }

  return data.reduce((sum: number, debt: any) => sum + debt.amount, 0);
};

export const fetchUniqueCustomers = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('sale')
    .select('customer_id', { count: 'exact', head: false });

  if (error) {
    console.error('Erreur lors de la récupération du nombre de clients uniques:', error);
    return 0;
  }

  return count || 0;
};

export const fetchRecentSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sale')
    .select(`
      *,
      customer:customer(*)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Erreur lors de la récupération des ventes récentes:', error);
    return [];
  }

  return data;
};