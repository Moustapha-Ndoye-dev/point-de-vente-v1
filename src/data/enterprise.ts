import { supabase } from '../supabaseClient';
import { Enterprise } from '../types/types';
import bcrypt from 'bcryptjs';
import { createSession } from './auth';

interface Session {
  token: string;
  enterprise: Omit<Enterprise, 'password'>;
  expiresAt: number;
}

// Fonction utilitaire pour générer un UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Créer un compte entreprise
export const createEnterpriseAccount = async (
  enterpriseData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }
): Promise<{ enterprise: Enterprise | null; error?: string }> => {
  try {
    // Vérifier d'abord la connexion internet
    if (!navigator.onLine) {
      throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion.');
    }

    // Vérifier si l'email existe déjà
    const { data: existingEnterprise, error: checkError } = await supabase
      .from('enterprise')
      .select('id')
      .eq('email', enterpriseData.email)
      .single();

    // Gérer spécifiquement les erreurs de connexion à Supabase
    if (checkError?.message?.includes('Failed to fetch') || 
        checkError?.message?.includes('NetworkError') ||
        checkError?.message?.includes('network')) {
      throw new Error('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.');
    }

    if (existingEnterprise) {
      throw new Error('Cette adresse email est déjà utilisée');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(enterpriseData.password, 10);

    // Créer l'entreprise avec un UUID généré
    const { data: enterprise, error: enterpriseError } = await supabase
      .from('enterprise')
      .insert([{
        id: generateUUID(),
        name: enterpriseData.name,
        email: enterpriseData.email,
        password: hashedPassword,
        phone: enterpriseData.phone,
        address: enterpriseData.address,
        subscription_status: 'active',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (enterpriseError?.message?.includes('Failed to fetch') || 
        enterpriseError?.message?.includes('NetworkError') ||
        enterpriseError?.message?.includes('network')) {
      throw new Error('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.');
    }

    if (enterpriseError) throw enterpriseError;

    const { password, ...enterpriseWithoutPassword } = enterprise;
    return { enterprise: enterpriseWithoutPassword };
  } catch (error: any) {
    console.error('Erreur lors de la création du compte:', error);
    return { 
      enterprise: null, 
      error: error.message || 'Une erreur est survenue lors de la création du compte'
    };
  }
};

// Connexion entreprise
export const loginEnterprise = async (
  email: string,
  password: string
): Promise<{ session: Session | null; enterprise: Enterprise | null; error?: string }> => {
  try {
    const { data: enterprise, error } = await supabase
      .from('enterprise')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !enterprise) {
      throw new Error('Entreprise non trouvée');
    }

    const validPassword = await bcrypt.compare(password, enterprise.password);
    if (!validPassword) {
      throw new Error('Mot de passe incorrect');
    }

    // Créer une session
    const session = await createSession(enterprise);

    // Mettre à jour la dernière connexion
    await supabase
      .from('enterprise')
      .update({ last_login: new Date().toISOString() })
      .eq('id', enterprise.id);

    const { password: _, ...enterpriseWithoutPassword } = enterprise;
    return { session, enterprise: enterpriseWithoutPassword };
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    return { session: null, enterprise: null, error: error.message };
  }
};

// Récupérer une entreprise par son ID
export const getEnterpriseById = async (id: string): Promise<Enterprise | null> => {
  const { data, error } = await supabase
    .from('enterprise')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération de l\'entreprise:', error);
    return null;
  }
  return data;
};

// Mettre à jour une entreprise
export const updateEnterprise = async (
  id: string,
  enterpriseData: Partial<Enterprise>
): Promise<Enterprise | null> => {
  const { data, error } = await supabase
    .from('enterprise')
    .update({
      ...enterpriseData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la mise à jour de l\'entreprise:', error);
    return null;
  }
  return data;
};

// Vérifier le statut de l'abonnement
export const checkSubscriptionStatus = async (id: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('enterprise')
    .select('subscription_status, subscription_end_date')
    .eq('id', id)
    .single();

  if (error || !data) return false;

  return data.subscription_status === 'active' && 
         new Date(data.subscription_end_date) > new Date();
};

// Renouveler l'abonnement
export const renewSubscription = async (id: string, months: number = 1): Promise<boolean> => {
  const enterprise = await getEnterpriseById(id);
  if (!enterprise) return false;

  const newEndDate = new Date(enterprise.subscriptionEndDate);
  newEndDate.setMonth(newEndDate.getMonth() + months);

  const { error } = await supabase
    .from('enterprise')
    .update({
      subscription_status: 'active',
      subscription_end_date: newEndDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  return !error;
};

// Désactiver l'abonnement
export const deactivateSubscription = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('enterprise')
    .update({
      subscription_status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  return !error;
}; 