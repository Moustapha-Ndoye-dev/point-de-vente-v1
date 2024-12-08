import { supabase } from '../supabaseClient';
import { Customer } from '../types/types';

export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data || [];
}

export async function searchCustomers(searchTerm: string) {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .ilike('name', `%${searchTerm}%`);
    
  if (error) throw error;
  return data || [];
}

export async function addCustomer(customerData: Omit<Customer, 'id'>) {
  const { data, error } = await supabase
    .from('customer')
    .insert([customerData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, customerData: Omit<Customer, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('customer')
      .update({
        name: customerData.name,
        phone: customerData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return null;
  }
}

export const deleteCustomer = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Vérifier d'abord si le client a des ventes
    const { data: sales, error: salesError } = await supabase
      .from('sale')
      .select('id')
      .eq('customer_id', id);

    if (salesError) throw salesError;

    if (sales && sales.length > 0) {
      return {
        success: false,
        error: 'Ce client ne peut pas être supprimé car il a des ventes associées'
      };
    }

    // Si pas de ventes, on peut supprimer le client
    const { error } = await supabase
      .from('customer')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression'
    };
  }
};

// Trouver un client par ID
export const findClientById = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erreur lors de la recherche du client par ID:', error);
    return null;
  }

  // Map backend fields to frontend types if necessary
  return {
    ...data,
    // Ensure all necessary fields are correctly mapped
  };
};

// Récupérer le nombre total de clients
export const fetchTotalCustomers = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('customer')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Erreur lors de la récupération du nombre total de clients:', error);
    return 0;
  }
  return count || 0;
};