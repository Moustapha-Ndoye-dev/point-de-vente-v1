import { supabase } from '../supabaseClient';
import { Customer } from '../types/types';

// Récupérer tous les clients
export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return [];
  }

  // Map backend fields to frontend types if necessary
  return data.map(customer => ({
    ...customer,
    // Ensure all necessary fields are correctly mapped
  }));
};

// Rechercher des clients
export const searchCustomers = async (searchTerm: string): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
    .order('name');

  if (error) {
    console.error('Erreur lors de la recherche des clients:', error);
    return [];
  }

  // Map backend fields to frontend types if necessary
  return data.map(customer => ({
    ...customer,
    // Ensure all necessary fields are correctly mapped
  }));
};

// Ajouter un client
export const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customer')
    .insert([customerData])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de l\'ajout du client:', error);
    return null;
  }

  // Map backend fields to frontend types if necessary
  return {
    ...data,
    // Ensure all necessary fields are correctly mapped
  };
};

// Modifier un client
export const updateCustomer = async (
  id: string,
  customerData: Partial<Omit<Customer, 'id'>>
): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customer')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    return null;
  }

  // Map backend fields to frontend types if necessary
  return {
    ...data,
    // Ensure all necessary fields are correctly mapped
  };
};

// Supprimer un client
export const deleteCustomer = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('customer')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return false;
  }
  return true;
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