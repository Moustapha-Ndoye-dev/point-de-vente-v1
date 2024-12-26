import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { EnterpriseProvider } from './contexts/EnterpriseContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './i18n/config';
import { LoadingProvider } from './contexts/LoadingContext';
import { registerSW } from 'virtual:pwa-register';

// Enregistrement du service worker

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <LoadingProvider>
      <EnterpriseProvider>
        <LanguageProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </LanguageProvider>
      </EnterpriseProvider>
    </LoadingProvider>
  </StrictMode>,
);
