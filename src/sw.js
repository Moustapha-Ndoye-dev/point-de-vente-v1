import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Précache des ressources statiques
precacheAndRoute(self.__WB_MANIFEST);

// Cache pour les polices Google
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365
      })
    ]
  })
);

// Cache pour l'API Supabase
registerRoute(
  /^https:\/\/api\.supabase\.co\/.*/i,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24
      })
    ]
  })
);

// Gestionnaire d'installation du SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Gestionnaire d'activation du SW
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
}); 