import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error("L'élément racine 'app' n'a pas été trouvé");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);