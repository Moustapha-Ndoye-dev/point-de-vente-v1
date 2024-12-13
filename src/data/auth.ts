import { supabase } from '../supabaseClient';
import { Enterprise, Session } from '../types/types';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'votre_secret_jwt'
);
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures

export const createSession = async (enterprise: Enterprise): Promise<Session> => {
  const expiresAt = Date.now() + SESSION_DURATION;

  const token = await new SignJWT({ 
      sub: enterprise.id,
      email: enterprise.email 
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(JWT_SECRET);

  const { password, ...enterpriseWithoutPassword } = enterprise;
  return {
    token,
    enterprise: enterpriseWithoutPassword,
    expiresAt
  };
};

export const loginEnterprise = async (
  email: string,
  password: string
): Promise<{ session: Session | null; enterprise: Enterprise | null; error?: string }> => {
  try {
    // Vérifier d'abord la connexion internet
    if (!navigator.onLine) {
      throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion et réessayer.');
    }

    const { data: enterprise, error } = await supabase
      .from('enterprise')
      .select('*')
      .eq('email', email)
      .single();

    // Gérer spécifiquement les erreurs de connexion à Supabase
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('network')) {
      throw new Error('Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.');
    }

    if (error || !enterprise) {
      throw new Error('Entreprise non trouvée');
    }

    const validPassword = await bcrypt.compare(password, enterprise.password);
    if (!validPassword) {
      throw new Error('Mot de passe incorrect');
    }

    // Create a session
    const session = await createSession(enterprise);

    // Update last login
    await supabase
      .from('enterprise')
      .update({ last_login: new Date().toISOString() })
      .eq('id', enterprise.id);

    const { password: _, ...enterpriseWithoutPassword } = enterprise;
    return { session, enterprise: enterpriseWithoutPassword };
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', error);
    // Retourner un message d'erreur plus convivial
    return { 
      session: null, 
      enterprise: null, 
      error: error.message || 'Une erreur est survenue lors de la connexion'
    };
  }
};

export const verifySession = async (token: string): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sub as string;
  } catch {
    return null;
  }
};

export const logout = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Déconnexion de Supabase
    const { error: supabaseError } = await supabase.auth.signOut();
    if (supabaseError) throw supabaseError;

    // Supprimer la session en base de données
    const token = localStorage.getItem('token');
    if (token) {
      const { error: sessionError } = await supabase
        .from('sessions')
        .delete()
        .eq('token', token);
      
      if (sessionError) {
        console.warn('Erreur lors de la suppression de la session:', sessionError);
      }
    }

    // Nettoyer le stockage local
    localStorage.clear();
    sessionStorage.clear();

    // Rediriger vers la page de connexion avec un paramètre pour éviter la redirection vers register
    window.location.replace('/login?source=logout');

    return { success: true };
  } catch (error: any) {
    console.error('Erreur lors de la déconnexion:', error);
    // En cas d'erreur, forcer la redirection
    window.location.replace('/login?source=logout');
    return { 
      success: false, 
      error: error.message || 'Une erreur est survenue lors de la déconnexion'
    };
  }
};

export const checkSession = async (): Promise<{
  isValid: boolean;
  enterprise: Enterprise | null;
}> => {
  const token = localStorage.getItem('token');
  const savedEnterprise = localStorage.getItem('enterprise');

  if (!token || !savedEnterprise) {
    return { isValid: false, enterprise: null };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const enterpriseData = JSON.parse(savedEnterprise);

    // Vérification plus stricte de la session
    if (payload.sub !== enterpriseData.id || payload.exp! * 1000 < Date.now()) {
      localStorage.removeItem('token');
      localStorage.removeItem('enterprise');
      return { isValid: false, enterprise: null };
    }

    // Vérification côté serveur
    const { data: enterprise, error } = await supabase
      .from('enterprise')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !enterprise) {
      localStorage.removeItem('token');
      localStorage.removeItem('enterprise');
      return { isValid: false, enterprise: null };
    }

    // Rediriger uniquement si on est sur login/register
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      window.location.href = '/dashboard';
    }

    return { isValid: true, enterprise: enterpriseData };
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('enterprise');
    return { isValid: false, enterprise: null };
  }
};