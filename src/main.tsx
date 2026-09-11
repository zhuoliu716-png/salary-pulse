import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/odometer-fix.css';
import './styles/mobile-layout-fix.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/salary-pulse/sw.js').catch(() => {
    window.dispatchEvent(new CustomEvent('offline-failed'));
  });
}
