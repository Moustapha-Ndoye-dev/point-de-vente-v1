import { supabase } from '../supabaseClient';
import { Customer } from '../types/types';

// Récupérer tous les clients d'une entreprise
export async function fetchCustomers(enterpriseId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .eq('enterprise_id', enterpriseId)
    .order('name');
    
  if (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return [];
  }
  return data || [];
}

// Ajouter la fonction fetchTotalCustomers
export async function fetchTotalCustomers(enterpriseId: string): Promise<number> {
  const { count, error } = await supabase
    .from('customer')
    .select('id', { count: 'exact', head: true })
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la récupération du nombre total de clients:', error);
    return 0;
  }

  return count || 0;
}

// Rechercher des clients par terme
export async function searchCustomers(searchTerm: string, enterpriseId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .eq('enterprise_id', enterpriseId)
    .ilike('name', `%${searchTerm}%`);
    
  if (error) {
    console.error('Erreur lors de la recherche des clients:', error);
    return [];
  }
  return data || [];
}

// Ajouter un nouveau client
export async function addCustomer(
  customerData: Omit<Customer, 'id'>, 
  enterpriseId: string
): Promise<Customer | null> {
  if (!enterpriseId) {
    console.error('Enterprise ID est requis');
    return null;
  }

  const { data, error } = await supabase
    .from('customer')
    .insert([{ 
      name: customerData.name,
      phone: customerData.phone,
      enterprise_id: enterpriseId
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Erreur lors de l\'ajout du client:', error);
    return null;
  }
  return data;
}

// Modifier un client existant
export async function updateCustomer(
  id: string, 
  customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, 
  enterpriseId: string
): Promise<Customer | null> {
  try {
    const { data, error } = await supabase
      .from('customer')
      .update({
        name: customerData.name,
        phone: customerData.phone
      })
      .eq('id', id)
      .eq('enterprise_id', enterpriseId)
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

// Supprimer un client
export const deleteCustomer = async (
  id: string, 
  enterpriseId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Vérifier les ventes associées
    const { data: sales, error: salesError } = await supabase
      .from('sale')
      .select('id')
      .eq('customer_id', id)
      .eq('enterprise_id', enterpriseId);

    if (salesError) throw salesError;

    if (sales && sales.length > 0) {
      return {
        success: false,
        error: 'Ce client ne peut pas être supprimé car il a des ventes associées'
      };
    }

    // Supprimer le client
    const { error } = await supabase
      .from('customer')
      .delete()
      .eq('id', id)
      .eq('enterprise_id', enterpriseId);

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

// Récupérer un client par ID
export const getCustomerById = async (
  id: string, 
  enterpriseId: string
): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .eq('id', id)
    .eq('enterprise_id', enterpriseId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du client:', error);
    return null;
  }
  return data;
};
