// MarkDriller Production Service Worker (PWA Shell Caching & Offline Resilience)
// Explicitly ignores API endpoints, authenticated calls, and payment webhooks.

const CACHE_NAME = 'markdriller-shell-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install: Cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical asset precache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Purge obsolete version caches and take immediate control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Safe caching strategy with SPA navigation fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER intercept or cache API requests, authentication, non-GET, or external origins
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // 2. Navigation requests (HTML documents: /dashboard, /login, /cbt/practice, etc.)
  // Always use Network-First with cached SPA shell fallback. NEVER return undefined to avoid ERR_FAILED.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (offline, cellular signal drop, or intermittent connection)
          const cache = await caches.open(CACHE_NAME);
          const cachedShell = (await cache.match('/index.html')) || (await cache.match('/'));
          if (cachedShell) {
            return cachedShell;
          }
          // Emergency fallback response to ensure respondWith NEVER resolves undefined
          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MarkDriller — Offline</title><style>body{font-family:system-ui,sans-serif;text-align:center;padding:50px 20px;background:#fdfbf7;color:#14181c}h1{color:#c2410c}.btn{display:inline-block;margin-top:20px;padding:10px 20px;background:#c2410c;color:#fff;text-decoration:none;border-radius:4px;font-weight:600}</style></head><body><h1>Connection Error</h1><p>MarkDriller could not reach the network. Please check your internet connection and try again.</p><a href="/" class="btn">Retry</a></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=UTF-8' },
            }
          );
        })
    );
    return;
  }

  // 3. Static assets (JS bundles, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately, fetch update in background (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              url.pathname.match(/\.(js|css|svg|png|jpg|webp|woff2?)$/)
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // If not in cache, fetch from network with safe Response fallback
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            url.pathname.match(/\.(js|css|svg|png|jpg|webp|woff2?)$/)
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});
