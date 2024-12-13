import { createContext, useContext, useState, useEffect } from 'react';

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
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

interface EnterpriseProviderProps {
  children: React.ReactNode;
}

export function EnterpriseProvider({ children }: EnterpriseProviderProps) {
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (enterprise) {
      localStorage.setItem('enterprise', JSON.stringify(enterprise));
    } else {
      localStorage.removeItem('enterprise');
    }
  }, [enterprise]);

  return (
    <EnterpriseContext.Provider value={{ enterprise, setEnterprise, loading, setLoading }}>
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