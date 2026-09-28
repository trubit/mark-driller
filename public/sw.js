// MarkDriller Production Service Worker (PWA Shell Caching & Offline Resilience)
// Explicitly ignores API endpoints, authenticated calls, payment webhooks, and navigation requests.

const CACHE_NAME = 'markdriller-shell-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

// Install: Cache essential static shell assets and immediately activate
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

// Activate: Purge ALL obsolete version caches (v1, v2, etc.) and take immediate control of clients
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
    }).then(() => self.clients.claim())
  );
});

// Fetch: Safe caching strategy with zero interference on HTML navigation
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

  // 2. NEVER intercept top-level HTML navigation requests (/dashboard, /login, /, etc.)
  // By letting the browser handle navigation natively, we completely eliminate the WebKit/iOS
  // "ERR_FAILED" / "This site can't be reached" failure mode where a Service Worker respondWith()
  // resolves to undefined or fails during cellular network / QUIC transitions.
  if (
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
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

      // If not in cache, fetch from network with safe Response fallback (NEVER resolve undefined)
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
