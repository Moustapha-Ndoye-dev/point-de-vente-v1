import { supabase } from '../supabaseClient';
import { Enterprise, Session } from '../types/types';
import bcrypt from 'bcryptjs';

export const loginEnterprise = async (
  email: string,
  password: string
): Promise<{ session?: { token: string }; enterprise: Enterprise | null; error?: string }> => {
  try {
    if (!navigator.onLine) {
      throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion et réessayer.');
    }

    const { data: enterprise, error } = await supabase
      .from('enterprise')
      .select('*')
      .eq('email', email)
      .single();

    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('network')) {
      throw new Error('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.');
    }

    if (error || !enterprise) {
      throw new Error('Entreprise non trouvée');
    }

    if (enterprise.subscription_status === false) {
      throw new Error('Votre abonnement a expiré. Veuillez contacter le support.');
    }

    const validPassword = await bcrypt.compare(password, enterprise.password);
    if (!validPassword) {
      throw new Error('Mot de passe incorrect');
    }

    // Update last login
    await supabase
      .from('enterprise')
      .update({ last_login: new Date().toISOString() })
      .eq('id', enterprise.id);

    const { password: _, ...enterpriseWithoutPassword } = enterprise;
    const session = { token: 'votre_token' };
    localStorage.setItem('enterprise', JSON.stringify(enterpriseWithoutPassword));
    localStorage.setItem('token', session.token);

    return { session, enterprise: enterpriseWithoutPassword };
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    return { 
      enterprise: null, 
      error: error.message || 'Une erreur est survenue lors de la connexion'
    };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login?source=logout');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    window.location.replace('/login?source=logout');
  }
};

export function useAuth() {
  const savedEnterprise = localStorage.getItem('enterprise');

  if (!savedEnterprise) {
    return { user: null };
  }

  try {
    const enterprise = JSON.parse(savedEnterprise);
    return { 
      user: {
        email: enterprise.email,
        isAdmin: enterprise.email === 'adminsamashop@gmail.com'
      }
    };
  } catch {
    return { user: null };
  }
}

export const checkSession = () => {
  const enterprise = localStorage.getItem('enterprise');
  if (!enterprise) {
    return { isValid: false, enterprise: null };
  }

  try {
    const parsedEnterprise = JSON.parse(enterprise);
    return { isValid: true, enterprise: parsedEnterprise };
  } catch {
    return { isValid: false, enterprise: null };
  }
};

export const createSession = (enterprise: Enterprise): Session => {
  const token = 'votre_token'; // Remplacez par une logique de génération de token
  const expiresAt = Date.now() + 3600 * 1000; // 1 heure d'expiration
  const currentTime = Date.now();
  const { password, ...enterpriseWithoutPassword } = enterprise;

  return {
    token,
    enterprise: enterpriseWithoutPassword,
    expiresAt,
    currentTime,
    hasEnterpriseAccess: true,
  };
};
