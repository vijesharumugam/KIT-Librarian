/*
  Minimal Service Worker for PWA installability and basic offline support.
  This file is intentionally simple. You can enhance it later with Workbox.
*/

const CACHE_NAME = 'kit-librarian-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add CSS/JS built assets at runtime via fetch handler cache-first or revise this array during build automation.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();

  // Kill-switch on localhost to remove stale SWs during development
  try {
    const isLocalhost = self.location && /^(http:\/\/)?(localhost|127\.0\.0\.1)(:\\d+)?$/i.test(self.location.origin);
    if (isLocalhost && self.registration && self.registration.unregister) {
      // Clear all caches and unregister this SW so dev server is not controlled anymore
      event.waitUntil(
        (async () => {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch (_) {}
          try {
            await self.registration.unregister();
          } catch (_) {}
          // Inform all clients to reload once to detach from SW control
          const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of clientsList) {
            client.navigate(client.url);
          }
        })()
      );
    }
  } catch (e) {
    // no-op
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Network-first for navigation requests (SPA routes)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});

