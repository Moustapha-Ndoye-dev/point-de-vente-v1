import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';

interface Enterprise {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

interface EnterpriseContextType {
  enterprise: Enterprise | null;
  setEnterprise: (enterprise: Enterprise | null) => void;
  loading: boolean;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(() => {
    const stored = localStorage.getItem('enterprise');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (enterprise) {
      localStorage.setItem('enterprise', JSON.stringify(enterprise));
    } else {
      localStorage.removeItem('enterprise');
    }
  }, [enterprise]);

  return (
    <EnterpriseContext.Provider value={{ enterprise, setEnterprise, loading }}>
      {children}
    </EnterpriseContext.Provider>
  );
}

export function useEnterprise() {
  const context = useContext(EnterpriseContext);
  if (context === undefined) {
    throw new Error('useEnterprise doit être utilisé avec EnterpriseProvider');
  }
  return context;
}