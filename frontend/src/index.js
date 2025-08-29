import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
const SW_ENABLED = process.env.REACT_APP_ENABLE_SW !== 'false'; // Enable by default
if (SW_ENABLED && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
} else {
  // In development, ensure any existing SWs are unregistered and caches cleared
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
  if (typeof caches !== 'undefined' && caches.keys) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }
  if (process.env.NODE_ENV !== 'production' || !SW_ENABLED) {
    console.log('[SW] Disabled (env:', process.env.NODE_ENV, 'REACT_APP_ENABLE_SW:', process.env.REACT_APP_ENABLE_SW, ')');
  }
}
