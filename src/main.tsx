import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// In Vite dev mode when dev-sw is disabled, ensure any previously registered dev-sw.js is cleaned up
if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(async (regs) => {
      const devRegs = regs.filter((r) => {
        const scriptUrl = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
        return scriptUrl.includes('dev-sw.js');
      });
      if (devRegs.length > 0) {
        await Promise.all(devRegs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.startsWith('workbox-') || k.startsWith('efata-worship-app-code'))
              .map((k) => window.caches.delete(k))
          );
        }
        if (navigator.serviceWorker.controller) {
          window.location.reload();
        }
      }
    })
    .catch(() => {});
}

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    // Check for Service Worker updates periodically & whenever connectivity returns
    const triggerUpdate = () => {
      if (navigator.onLine) {
        registration.update().catch(() => {});
      }
    };

    window.setInterval(triggerUpdate, 30 * 60 * 1000);
    window.addEventListener('online', triggerUpdate);
  },
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
