import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'fr', // langue par défaut
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

// Force le chargement initial de la langue
const savedLanguage = localStorage.getItem('language') || 'fr';
i18n.changeLanguage(savedLanguage);

export default i18n;