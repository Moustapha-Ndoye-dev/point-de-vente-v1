import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Nettoyage des anciens caches
cleanupOutdatedCaches();

// Précache des ressources statiques
precacheAndRoute(self.__WB_MANIFEST);

// Cache pour les polices Google
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
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
    cacheName: 'api-cache-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24
      })
    ],
    networkTimeoutSeconds: 3
  })
);

// Cache pour les ressources statiques
registerRoute(
  /\.(?:js|css|html|png|jpg|jpeg|svg|ico)$/,
  new StaleWhileRevalidate({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30
      })
    ]
  })
);

// Gestionnaire d'installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      caches.open('offline-v1').then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.webmanifest',
          '/offline.html'
        ]);
      })
    ])
  );
});

// Gestionnaire d'activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Nettoyage des anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => cacheName.startsWith('offline-')).map(cacheName => {
            if (cacheName !== 'offline-v1') {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
}); 