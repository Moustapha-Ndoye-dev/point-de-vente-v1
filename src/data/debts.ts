// debts.ts

import { supabase } from '../supabaseClient';
import { Debt, Customer } from '../types/types';

// Récupérer les dettes selon les filtres
interface FetchDebtsFilters {
    settled?: boolean;
    overdue?: boolean;
    startDate?: string;
    endDate?: string;
}

export const fetchDebts = async (enterpriseId: string, filter: FetchDebtsFilters) => {
    let query = supabase
        .from('debt')
        .select('*')
        .eq('enterprise_id', enterpriseId);
  
    if (filter.settled !== undefined) {
        query = query.eq('settled', filter.settled);
    }
  
    if (filter.overdue) {
        const today = new Date().toISOString();
        query = query.eq('settled', false).lt('due_date', today);
    }
  
    if (filter.startDate) {
        const start = new Date(filter.startDate);
        start.setHours(0, 0, 0, 0);
        query = query.gte('created_at', start.toISOString());
    }
  
    if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
    }
  
    const { data, error } = await query.order('created_at', { ascending: false });
  
    if (error) {
        console.error('Erreur lors de la récupération des dettes:', error);
        return [];
    }
  
    return data.map(debt => ({
        id: debt.id,
        saleId: debt.sale_id,
        customerId: debt.customer_id,
        amount: parseFloat(debt.amount),
        settled: debt.settled,
        dueDate: debt.due_date,
        createdAt: debt.created_at,
        settledAt: debt.settled_at,
        enterpriseId: debt.enterprise_id
    }));
  };

// Récupérer les dettes en cours (non réglées)
export const fetchPendingDebts = async (enterpriseId: string): Promise<Debt[]> => {
    return fetchDebts(enterpriseId, { settled: false });
};

// Récupérer les dettes réglées
export const fetchSettledDebts = async (enterpriseId: string): Promise<Debt[]> => {
    return fetchDebts(enterpriseId, { settled: true });
};

// Récupérer les dettes en retard
export const fetchOverdueDebts = async (enterpriseId: string): Promise<Debt[]> => {
    const { data, error } = await supabase
        .from('debt')
        .select(`
            *,
            customer:customer_id (
                name
            )
        `)
        .eq('enterprise_id', enterpriseId)
        .eq('settled', false)
        .lt('due_date', new Date().toISOString());

    if (error) {
        console.error('Erreur lors de la récupération des dettes en retard:', error);
        return [];
    }

    // Transformer les données pour correspondre à l'interface Debt
    const overdueDebts = data.map(debt => ({
        id: debt.id,
        saleId: debt.sale_id,
        customerId: debt.customer_id,
        customerName: debt.customer?.name,
        amount: parseFloat(debt.amount),
        settled: debt.settled,
        dueDate: debt.due_date,
        createdAt: debt.created_at,
        settledAt: debt.settled_at,
        enterpriseId: debt.enterprise_id
    }));

    // Notifier pour chaque dette en retard
    overdueDebts.forEach(debt => {
        const daysOverdue = Math.floor(
            (new Date().getTime() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (window.Notification && Notification.permission === 'granted') {
            const message = `Dette en retard de ${daysOverdue} jours pour ${debt.customerName || 'Client inconnu'} - Montant: ${debt.amount} FCFA`;
            
            try {
                new Notification('Dette en retard', {
                    body: message,
                    icon: '/notification-icon.png',
                    tag: `debt-${debt.id}`, // Évite les doublons
                    requireInteraction: true // La notification reste jusqu'à ce que l'utilisateur interagisse
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi de la notification:', error);
            }
        }
    });

    return overdueDebts;
};

// Récupérer les dettes du jour
export const fetchTodaysDebts = async (enterpriseId: string): Promise<Debt[]> => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    return fetchDebts(enterpriseId, { startDate: startOfDay, endDate: endOfDay });
};

// Récupérer les dettes de la semaine
export const fetchWeeksDebts = async (enterpriseId: string): Promise<Debt[]> => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const endOfWeek = new Date(now.setDate(now.getDate() + 6), 23, 59, 59, 999).toISOString();
    return fetchDebts(enterpriseId, { startDate: startOfWeek, endDate: endOfWeek });
};

// Récupérer les dettes du mois
export const fetchMonthsDebts = async (enterpriseId: string): Promise<Debt[]> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    return fetchDebts(enterpriseId, { startDate: startOfMonth, endDate: endOfMonth });
};

// Récupérer toutes les dettes
export const fetchAllDebts = async (): Promise<Debt[]> => {
    const { data, error } = await supabase
        .from('debt')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erreur lors de la récupération de toutes les dettes:', error);
        return [];
    }

    // Mapper les données pour correspondre à l'interface Debt avec camelCase
    return data.map(debt => ({
        id: debt.id,
        saleId: debt.sale_id,
        customerId: debt.customer_id,
        amount: parseFloat(debt.amount),
        settled: debt.settled,
        dueDate: debt.due_date,
        createdAt: debt.created_at,
        settledAt: debt.settled_at,
    })) as Debt[];
};

// Ajouter une nouvelle dette
export const addDebt = async (debtData: Omit<Debt, 'id'>, enterpriseId: string): Promise<Debt | null> => {
    const { data, error } = await supabase
        .from('debt')
        .insert([{
            sale_id: debtData.saleId,
            customer_id: debtData.customerId,
            amount: debtData.amount,
            settled: debtData.settled,
            due_date: debtData.dueDate,
            created_at: debtData.createdAt,
            settled_at: debtData.settledAt,
            enterprise_id: enterpriseId
        }])
        .select()
        .single();

    if (error) {
        console.error('Erreur lors de l\'ajout de la dette:', error);
        return null;
    }

    return {
        id: data.id,
        saleId: data.sale_id,
        customerId: data.customer_id,
        amount: parseFloat(data.amount),
        settled: data.settled,
        dueDate: data.due_date,
        createdAt: data.created_at,
        settledAt: data.settled_at,
        enterpriseId: data.enterprise_id
    };
};

// Mettre à jour une dette existante
export const updateDebt = async (id: string, debtData: Partial<Omit<Debt, 'id'>>): Promise<Debt | null> => {
    const updateData: Partial<any> = {};
    if (debtData.saleId !== undefined) updateData.sale_id = debtData.saleId;
    if (debtData.customerId !== undefined) updateData.customer_id = debtData.customerId;
    if (debtData.amount !== undefined) updateData.amount = debtData.amount;
    if (debtData.settled !== undefined) updateData.settled = debtData.settled;
    if (debtData.dueDate !== undefined) updateData.due_date = debtData.dueDate;
    if (debtData.createdAt !== undefined) updateData.created_at = debtData.createdAt;
    if (debtData.settledAt !== undefined) updateData.settled_at = debtData.settledAt;

    const { data, error } = await supabase
        .from('debt')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Erreur lors de la mise à jour de la dette:', error);
        return null;
    }

    return {
        id: data.id,
        saleId: data.sale_id,
        customerId: data.customer_id,
        amount: parseFloat(data.amount),
        settled: data.settled,
        dueDate: data.due_date,
        createdAt: data.created_at,
        settledAt: data.settled_at,
    } as unknown as Debt;
};

// Supprimer une dette
export const deleteDebt = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('debt')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Erreur lors de la suppression de la dette:', error);
        return false;
    }
    return true;
};

// Marquer une dette comme payée
export const markDebtAsPaid = async (id: string): Promise<Debt | null> => {
    try {
        // D'abord, récupérer la dette pour obtenir le sale_id
        const { data: debtData, error: debtError } = await supabase
            .from('debt')
            .select('*')
            .eq('id', id)
            .single();

        if (debtError) throw debtError;

        // Mettre à jour la dette
        const { data, error } = await supabase
            .from('debt')
            .update({ 
                settled: true, 
                settled_at: new Date().toISOString() 
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Mettre à jour le statut de la vente
        const { error: saleError } = await supabase
            .from('sale')
            .update({ status: 'completed' })
            .eq('id', debtData.sale_id);

        if (saleError) throw saleError;

        return {
            id: data.id,
            saleId: data.sale_id,
            customerId: data.customer_id,
            amount: parseFloat(data.amount),
            settled: data.settled,
            dueDate: data.due_date,
            createdAt: data.created_at,
            settledAt: data.settled_at,
        } as unknown as Debt;

    } catch (error) {
        console.error('Erreur lors du paiement de la dette:', error);
        return null;
    }
};

// Récupérer le nom d'un client par son ID
export const getCustomerNameById = async (id: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('customer')
        .select('name')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Erreur lors de la récupération du nom du client par ID:', error);
        return null;
    }
    return data?.name || null;
};

// Récupérer l'ID d'un client par son nom
export const getCustomerIdByName = async (customerName: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('customer')
        .select('id')
        .eq('name', customerName)
        .single();

    if (error) {
        console.error('Erreur lors de la récupération de l\'ID du client:', error);
        return null;
    }
    return data?.id || null;
};

// Récupérer les clients
export const fetchCustomers = async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customer')
      .select('id, name');
  
    if (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      return [];
    }

    // Mapper les données pour correspondre à l'interface Customer
    return data.map(customer => ({
        id: customer.id,
        name: customer.name,
    })) as Customer[];
};
