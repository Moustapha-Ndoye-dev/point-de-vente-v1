import { supabase } from '../supabaseClient';
import { Enterprise } from '../types/types';

export async function getEnterprises(): Promise<Enterprise[]> {
  const { data, error } = await supabase
    .from("enterprise")
    .select("id, name, email, phone, subscription_status, subscription_end_date, created_at, updated_at, last_login");

  if (error) throw error;

  // Mapper les données pour correspondre au type Enterprise
  return data.map((enterprise: any) => ({
    id: enterprise.id,
    name: enterprise.name,
    email: enterprise.email,
    phone: enterprise.phone, // Ajoutez cette ligne
    subscriptionStatus: enterprise.subscription_status,
    subscriptionEndDate: enterprise.subscription_end_date,
    createdAt: enterprise.created_at,
    updatedAt: enterprise.updated_at,
    lastLogin: enterprise.last_login,
  }));
}

export const activateEnterprise = async (id: string): Promise<void> => {
  try {
    console.log(`Activation de l'entreprise ID: ${id}`);
    const { error } = await supabase
      .from('enterprise')
      .update({ 
        subscription_status: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    console.log('Activation réussie');
  } catch (error) {
    console.error('Erreur lors de l\'activation de l\'entreprise:', error);
    throw new Error('Erreur lors de l\'activation de l\'entreprise');
  }
};

export const deactivateEnterprise = async (id: string): Promise<void> => {
  try {
    console.log(`Désactivation de l'entreprise ID: ${id}`);
    const { error } = await supabase
      .from('enterprise')
      .update({ 
        subscription_status: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    console.log('Désactivation réussie');
  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'entreprise:', error);
    throw new Error('Erreur lors de la désactivation de l\'entreprise');
  }
};

export function isEnterpriseActive(lastLogin: string | null): boolean {
  if (!lastLogin) return false;
  const lastLoginDate = new Date(lastLogin);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - lastLoginDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 8;
}

export async function getEnterprisesThisMonth(): Promise<Enterprise[]> {
  const currentMonth = new Date().getMonth();
  const { data, error } = await supabase
    .from("enterprise")
    .select("id, name, email, phone, subscription_status, subscription_end_date, created_at, updated_at, last_login")
    .filter('created_at', 'gte', new Date(new Date().setDate(1)).toISOString());

  if (error) throw error;

  return data
    .filter((enterprise: any) => new Date(enterprise.created_at).getMonth() === currentMonth)
    .map((enterprise: any) => ({
      id: enterprise.id,
      name: enterprise.name,
      email: enterprise.email,
      phone: enterprise.phone,
      subscriptionStatus: enterprise.subscription_status,
      subscriptionEndDate: enterprise.subscription_end_date,
      createdAt: enterprise.created_at,
      updatedAt: enterprise.updated_at,
      lastLogin: enterprise.last_login,
    }));
}
