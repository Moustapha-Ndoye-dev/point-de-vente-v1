import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(() => 
    localStorage.getItem('language') || 'fr'
  );

  const { i18n } = useTranslation();

  useEffect(() => {
    // Initialisation au montage
    const savedLanguage = localStorage.getItem('language') || 'fr';
    i18n.changeLanguage(savedLanguage);
    setLanguageState(savedLanguage);
  }, [i18n]);

  const setLanguage = (lang: string) => {
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}