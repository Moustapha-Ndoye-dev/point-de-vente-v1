import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './i18n/config';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <NotificationProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </NotificationProvider>
    </LanguageProvider>
  </StrictMode>,
);