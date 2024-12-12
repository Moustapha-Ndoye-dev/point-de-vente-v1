import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { EnterpriseProvider } from './contexts/EnterpriseContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './i18n/config';

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <EnterpriseProvider>
      <LanguageProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </LanguageProvider>
    </EnterpriseProvider>
  </StrictMode>,
);