import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

clientsClaim();
self.skipWaiting();

// Précache des ressources statiques
precacheAndRoute(self.__WB_MANIFEST);

// Gestion des navigations SPA
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'))
);

// Cache pour les images
registerRoute(
  ({ request }) => request.destination === 'images',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

// Cache pour les autres ressources
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new NetworkFirst({
    cacheName: 'assets'
  })
);
